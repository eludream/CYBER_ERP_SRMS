using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using CyberErp.Srms.Inf.Models;
using System.Security.Claims;
using System.Text;

namespace CyberErp.Srms.Api.Configuration
{
    public static class AuthenticationServiceExtensions
    {
        public static IServiceCollection AddSrmsAuthentication(
            this IServiceCollection services, 
            IConfiguration configuration)
        {
            var jwtConfig = configuration.GetSection("Jwt").Get<JwtConfiguration>() ?? new JwtConfiguration();
           
            services.AddAuthentication(options =>
            {
                // Default scheme for authentication - supports both JWT Bearer for API and Cookies for browser
                options.DefaultAuthenticateScheme = "Smart";
                options.DefaultChallengeScheme = "Smart";
                options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultSignOutScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            })
            .AddPolicyScheme("Smart", "JWT or signed tenant cookie", options =>
            {
                options.ForwardDefaultSelector = context =>
                {
                    var authorization = context.Request.Headers.Authorization.ToString();
                    var path = context.Request.Path;
                    var bearerContextEndpoint =
                        path.StartsWithSegments("/api/organization-context") ||
                        path.StartsWithSegments("/api/tenant-context");

                    // Context-selection requests must be able to recover from a stale
                    // tenant cookie by authenticating with the freshly issued JWT.
                    // Platform and tenant-scoped requests prefer the signed cookie when
                    // one exists, so a stale bearer token cannot invalidate a live
                    // browser session.
                    if (bearerContextEndpoint &&
                        authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    {
                        return JwtBearerDefaults.AuthenticationScheme;
                    }

                    return context.Request.Cookies.ContainsKey(".CyberErp.Srms.Auth")
                        ? CookieAuthenticationDefaults.AuthenticationScheme
                        : JwtBearerDefaults.AuthenticationScheme;
                };
            })
            .AddCookie("Cookies", options =>
            {
                options.Cookie.Name = ".CyberErp.Srms.Auth";
                options.Cookie.HttpOnly = true;
                options.Cookie.IsEssential = true;
                options.Cookie.SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Lax;
                options.Cookie.SecurePolicy = Microsoft.AspNetCore.Http.CookieSecurePolicy.SameAsRequest;
                // The real timeout is loaded from PlatformSystemSettings while
                // validating each ticket. This value is only a safe fallback.
                options.ExpireTimeSpan = TimeSpan.FromMinutes(30);
                options.SlidingExpiration = true;
                options.LoginPath = "/Account/Login";
                options.LogoutPath = "/Account/Logout";
                options.AccessDeniedPath = "/Account/AccessDenied";
                options.Events = new CookieAuthenticationEvents
                {
                    OnValidatePrincipal = async context =>
                    {
                        var db = context.HttpContext.RequestServices.GetRequiredService<SrmsDbContext>();
                        var timeoutMinutes = await db.PlatformSystemSettings
                            .AsNoTracking()
                            .Select(x => (int?)x.SessionTimeoutMinutes)
                            .SingleOrDefaultAsync(context.HttpContext.RequestAborted) ?? 30;
                        var now = DateTimeOffset.UtcNow;
                        var issuedUtc = context.Properties.IssuedUtc;

                        var userIdValue = context.Principal?.FindFirstValue("UserId")
                            ?? context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                        var accountIsActive = Guid.TryParse(userIdValue, out var userId)
                            && await db.User.AsNoTracking().AnyAsync(
                                user => user.Id == userId && user.AccountStatus,
                                context.HttpContext.RequestAborted);

                        if (!accountIsActive || !issuedUtc.HasValue || now - issuedUtc.Value >= TimeSpan.FromMinutes(timeoutMinutes))
                        {
                            context.RejectPrincipal();
                            await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                            return;
                        }

                        // Renew from the latest authenticated request, applying
                        // the current configured timeout even to existing users.
                        context.Properties.IssuedUtc = now;
                        context.Properties.ExpiresUtc = now.AddMinutes(timeoutMinutes);
                        context.ShouldRenew = true;
                    },
                    OnRedirectToLogin = context =>
                    {
                        // For API requests, return 401 instead of redirecting
                        if (context.Request.Path.StartsWithSegments("/api") && 
                            context.Response.StatusCode == 200)
                        {
                            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                            return Task.CompletedTask;
                        }
                        context.Response.Redirect(context.RedirectUri);
                        return Task.CompletedTask;
                    },
                    OnRedirectToAccessDenied = context =>
                    {
                        // For API requests, return 403 instead of redirecting
                        if (context.Request.Path.StartsWithSegments("/api") && 
                            context.Response.StatusCode == 200)
                        {
                            context.Response.StatusCode = StatusCodes.Status403Forbidden;
                            return Task.CompletedTask;
                        }
                        context.Response.Redirect(context.RedirectUri);
                        return Task.CompletedTask;
                    }
                };
            })
      
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtConfig.Issuer,
                    ValidAudience = jwtConfig.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtConfig.Key))
                };
                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = async context =>
                    {
                        var userIdValue = context.Principal?.FindFirstValue("UserId")
                            ?? context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                        if (!Guid.TryParse(userIdValue, out var userId))
                        {
                            context.Fail("The authenticated user is invalid.");
                            return;
                        }

                        var db = context.HttpContext.RequestServices.GetRequiredService<SrmsDbContext>();
                        var accountIsActive = await db.User.AsNoTracking().AnyAsync(
                            user => user.Id == userId && user.AccountStatus,
                            context.HttpContext.RequestAborted);
                        if (!accountIsActive) context.Fail("The user account is inactive or locked.");
                    }
                };
            });

            return services;
        }

        public static IApplicationBuilder UseSrmsAuthentication(
            this IApplicationBuilder app)
        {
            app.UseAuthentication();

            // Custom middleware to extract tenant from JWT claims or cookies after authentication
            app.Use(async (context, next) =>
            {
                string? tenantId = null;
                // Tenant context is accepted only from the signed authenticated principal.
                if (context.User?.Identity?.IsAuthenticated == true)
                {
                    var tenantIdClaim = context.User.FindFirst("TenantId");
                    if (tenantIdClaim != null)
                    {
                        tenantId = tenantIdClaim.Value;
                    }
                    
                }
                
                // Store tenant ID in HttpContext.Items for later use
                if (!string.IsNullOrEmpty(tenantId))
                {
                    context.Items["TenantId"] = tenantId;
                }

                await next();
            });

            return app;
        }
        
        [Obsolete("Unsigned tenant cookies are not a valid security context. Use /api/tenant-context/select.")]
        public static void SetTenantCookie(this HttpContext context, string tenantId)
        {
            throw new InvalidOperationException("Unsigned tenant cookies are disabled.");
        }
        
        /// <summary>
        /// Clears the tenant ID cookie.
        /// </summary>
        public static void ClearTenantCookie(this HttpContext context)
        {
            context.Response.Cookies.Delete("TenantId");
        }
    }
}
