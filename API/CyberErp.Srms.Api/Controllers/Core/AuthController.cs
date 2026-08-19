using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CyberErp.Srms.App.Features.Core.Users.Login;
using CyberErp.Srms.App.Features.Core.Users.Logout;
using CyberErp.Srms.App.Features.Core.Users.Register;
using CyberErp.Srms.App.Features.Core.Users.GetCurrentUser;
using CyberErp.Srms.App.Features.Core.Users.DTOs;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.Cookies;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.Inf.Common;
using CyberErp.Srms.Inf.Models;
using CyberErp.Srms.Dom.Entities.Core;

namespace CyberErp.Srms.Api.Controllers.Core
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ILoginUser _loginUser;
        private readonly ILogoutUser _logoutUser;
        private readonly ILogoutCookieUser _logoutCookieUser;
        private readonly IRegisterUser _registerUser;
        private readonly IRegisterWithGoogle _registerWithGoogle;
        private readonly IGetCurrentUser _getCurrentUser;
        private readonly ITokenParser _tokenParser;
        private readonly IAuthentication _authentication;
        private readonly SrmsDbContext _db;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            ILoginUser loginUser,
            ILogoutUser logoutUser,
            ILogoutCookieUser logoutCookieUser,
            IRegisterUser registerUser,
            IRegisterWithGoogle registerWithGoogle,
            IGetCurrentUser getCurrentUser,
            ITokenParser tokenParser,
            IAuthentication authentication,
            SrmsDbContext db,
            ILogger<AuthController> logger)
        {
            _loginUser = loginUser;
            _logoutUser = logoutUser;
            _logoutCookieUser = logoutCookieUser;
            _registerUser = registerUser;
            _registerWithGoogle = registerWithGoogle;
            _getCurrentUser = getCurrentUser;
            _tokenParser = tokenParser;
            _authentication = authentication;
            _db = db;
            _logger = logger;
        }

        /// <summary>
        /// Authenticate user with username/password (returns JWT token)
        /// </summary>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<UserResult> Login([FromBody] LoginUserDto dto)
        {
            try
            {
                var result = await _loginUser.Loginsync(dto);
                await RecordLoginAsync(result.Id, string.Empty, dto.UserName, "Success", null);
                return result;
            }
            catch (Exception ex)
            {
                await RecordLoginAsync(null, string.Empty, dto.UserName, "Failed", ex.Message);
                throw;
            }
        }

        private async Task RecordLoginAsync(Guid? userId, string tenantId, string userName, string status, string? failureReason)
        {
            try
            {
                var trail = LoginTrail.Create(userId, DateTime.UtcNow, HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown", status);
                trail.TenantId = tenantId;
                trail.SetDetails(userName, Request.Headers.UserAgent.ToString(), failureReason);
                _db.LoginTrail.Add(trail);
                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Audit persistence must not replace the original authentication result.
                _logger.LogError(ex, "Unable to persist {Status} login audit for {UserName}", status, userName);
            }
        }

        /// <summary>
        /// Authenticate user with username/password and create cookie-based session
        /// </summary>
        [HttpPost("login/cookie")]
        [AllowAnonymous]
        public async Task<IActionResult> LoginWithCookie([FromBody] LoginUserDto dto)
        {
            var result = await _loginUser.Loginsync(dto);
            var sessionTimeoutMinutes = await _db.PlatformSystemSettings
                .AsNoTracking()
                .Select(x => (int?)x.SessionTimeoutMinutes)
                .SingleOrDefaultAsync() ?? 30;
            result.SessionTimeoutMinutes = sessionTimeoutMinutes;

            // Parse the JWT token to extract claims
            var jwtToken = _tokenParser.ParseToken(result.Token);
            
            // Create claims identity from JWT token
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, result.Id.ToString()),
                new Claim(ClaimTypes.Name, result.UserName),
                new Claim(ClaimTypes.Email, result.Email),
                new Claim("FullName", result.FullName),
                new Claim("PhoneNo", result.PhoneNumber ?? string.Empty),
                new Claim("UserId", result.Id.ToString()),
                new Claim("UserName", result.UserName),
                new Claim("Email", result.Email),
                new Claim("FullName", result.FullName),
            };

            // Add all claims from JWT token
            foreach (var claim in jwtToken.Claims)
            {
                if (!claims.Any(c => c.Type == claim.Type))
                {
                    claims.Add(new Claim(claim.Type, claim.Value));
                }
            }

            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var authProperties = new AuthenticationProperties
            {
                IsPersistent = true,
                IssuedUtc = DateTimeOffset.UtcNow,
                ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(sessionTimeoutMinutes),
                AllowRefresh = true
            };

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(claimsIdentity),
                authProperties);

            return Ok(result);
        }

        /// <summary>
        /// Logout user and invalidate token
        /// </summary>
        [HttpPost("logout")]
        [AllowAnonymous]
        public async Task<bool> Logout([FromBody] LogoutRequestDto dto)
        {
            return await _logoutUser.LogoutAsync(dto.TokenId);
        }

        /// <summary>
        /// Logout user and clear cookie session
        /// </summary>
        [HttpPost("logout/cookie")]
        public async Task<IActionResult> LogoutCookie()
        {
            await _logoutCookieUser.LogoutAsync();
            return Ok(new { message = "Logged out successfully" });
        }

        /// <summary>
        /// Register new user with tenant
        /// </summary>
        [HttpPost("register")]
        [Authorize]
        public async Task<RegisterResult> Register([FromBody] RegisterUserDto dto)
        {
            if (!bool.TryParse(User.FindFirst("IsPlatformAdministrator")?.Value, out var platformAdmin) || !platformAdmin)
                throw new UnauthorizedAccessException("Public tenant registration is disabled.");
            return await _registerUser.RegisterAsync(dto);
        }

        /// <summary>
        /// Register new user with Google
        /// </summary>
        [HttpPost("register/google")]
        [Authorize]
        public async Task<RegisterResult> RegisterWithGoogle([FromBody] RegisterWithGoogleDto dto)
        {
            if (!bool.TryParse(User.FindFirst("IsPlatformAdministrator")?.Value, out var platformAdmin) || !platformAdmin)
                throw new UnauthorizedAccessException("Public tenant registration is disabled.");
            return await _registerWithGoogle.RegisterWithGoogleAsync(dto);
        }

        /// <summary>
        /// Check if user is authenticated (for React useAuth pattern)
        /// </summary>
        [HttpGet("loginStatus")]
        [AllowAnonymous]
        public async Task<IActionResult> Me()
        {
            var result = await _getCurrentUser.GetAsync();
            
            if (!result.IsAuthenticated)
            {
                // This endpoint is a session probe used on public pages. Being
                // signed out is an expected result, not an HTTP failure.
                return Ok(new { IsAuthenticated = false });
            }

            var userIdentity = Guid.TryParse(result.UserId, out var currentUserId)
                ? await _db.User
                    .Where(x => x.Id == currentUserId)
                    .Select(x => new { x.FullName, x.UserName, x.Email, x.PhoneNumber, x.IsPlatformAdministrator })
                    .SingleOrDefaultAsync()
                : null;

            return Ok(new
            {
                result.UserId,
                Email = userIdentity?.Email ?? result.Email,
                Name = userIdentity?.FullName ?? result.Name,
                UserName = userIdentity?.UserName ?? string.Empty,
                PhoneNumber = userIdentity?.PhoneNumber ?? string.Empty,
                result.TenantId,
                IsPlatformAdministrator = userIdentity?.IsPlatformAdministrator ?? false,
                ProfilePictureUrl = $"/api/v1.0/User/{result.UserId}/profile-picture",
                SessionTimeoutMinutes = await _db.PlatformSystemSettings
                    .AsNoTracking()
                    .Select(x => (int?)x.SessionTimeoutMinutes)
                    .SingleOrDefaultAsync() ?? 30,
                result.IsAuthenticated
            });
        }

        /// <summary>
        /// Verify cookie-based session is valid
        /// </summary>
        [HttpGet("verify-cookie")]
        [Authorize(AuthenticationSchemes = "Cookies")]
        public IActionResult VerifyCookie()
        {
            return Ok(new
            {
                UserId = User.FindFirst("UserId")?.Value,
                UserName = User.FindFirst("UserName")?.Value,
                Email = User.FindFirst("Email")?.Value,
                FullName = User.FindFirst("FullName")?.Value,
                TenantId = User.FindFirst("TenantId")?.Value,
                IsAuthenticated = User.Identity?.IsAuthenticated ?? false
            });
        }
    }

    public class LogoutRequestDto
    {
        public string TokenId { get; set; } = string.Empty;
    }
}
