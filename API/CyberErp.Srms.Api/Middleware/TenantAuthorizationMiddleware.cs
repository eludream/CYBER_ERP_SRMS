using System.Security.Claims;
using System.Text.RegularExpressions;
using CyberErp.Srms.App.Common.Services;

namespace CyberErp.Srms.Api.Middleware;

public sealed class TenantAuthorizationMiddleware(RequestDelegate next)
{
    private static readonly Regex SelfServiceUserPath = new(
        @"^/api/(?:v[\d.]+/)?User/(?:password-policy|(?<userId>[0-9a-fA-F-]{36})(?:/(?<action>account-profile|change-password|preferences|profile-picture))?)/?$",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    public async Task InvokeAsync(HttpContext context, IMultiTenantControlPlaneService access, IConfiguration configuration, IWebHostEnvironment environment)
    {
        if (environment.IsDevelopment() && configuration.GetValue<bool>("Security:BypassAuthorization"))
        {
            await next(context);
            return;
        }

        var path=context.Request.Path.Value??string.Empty;
        if (!path.StartsWith("/api",StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/platform",StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/v1.0/lookup-categories",StringComparison.OrdinalIgnoreCase) ||
            path.Contains("/Auth",StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/organization-context",StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/organization/",StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/tenant-context",StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/tenant-resources/",StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/tenant/",StringComparison.OrdinalIgnoreCase) ||
            path.Contains("/Module/system-resource", StringComparison.OrdinalIgnoreCase))
        { await next(context); return; }

        if (context.User.Identity?.IsAuthenticated != true) { await next(context); return; }
        if (!Guid.TryParse(context.User.FindFirstValue("UserId") ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier),out var userId) ||
            !Guid.TryParse(context.User.FindFirstValue("TenantId"),out var tenantId) || tenantId==Guid.Empty)
        {
            // Signed-in users with no tenant still need account self-service
            // (profile, password, preferences) from the access-blocked screen.
            if (IsSelfServiceUserRequest(path, context.Request.Method, userId))
            {
                await next(context);
                return;
            }
            context.Response.StatusCode=StatusCodes.Status403Forbidden; await context.Response.WriteAsJsonAsync(new{error="An authenticated tenant context is required."}); return;
        }

        var segments=path.Split('/',StringSplitOptions.RemoveEmptyEntries);
        var apiIndex=Array.FindIndex(segments,x=>x.Equals("api",StringComparison.OrdinalIgnoreCase));
        var controllerIndex=apiIndex+1;
        if(controllerIndex<segments.Length && segments[controllerIndex].Length>1 && (segments[controllerIndex][0]=='v'||segments[controllerIndex][0]=='V') && segments[controllerIndex][1..].All(char.IsDigit)) controllerIndex++;
        var controller=controllerIndex>=0&&controllerIndex<segments.Length?segments[controllerIndex]:"UNKNOWN";
        var action=context.Request.Method switch { "GET" or "HEAD"=>"view", "POST"=>"add", "PUT" or "PATCH"=>"edit", "DELETE"=>"delete", _=>"approve" };

        // These collection endpoints are already tenant-filtered by their repositories.
        // Allow them to return empty collections when a tenant has no assigned modules
        // or operations; requiring an operation-backed permission here creates a
        // circular 403 because no such permission can exist before the rows do.
        var isTenantFilteredCollectionRead =
            action == "view" &&
            segments.Length == controllerIndex + 1 &&
            (controller.Equals("Operation", StringComparison.OrdinalIgnoreCase) ||
             controller.Equals("Module", StringComparison.OrdinalIgnoreCase));
        if (isTenantFilteredCollectionRead)
        {
            await next(context);
            return;
        }

        // Operation reads are tenant-filtered and operation edits/deletes perform
        // an explicit tenant-administrator check in OperationController. Do not
        // depend on a tenant having a bootstrap SRMS.OPERATION.* permission row,
        // because that row may legitimately be absent on older tenants.
        var isTenantOperationRequest =
            controller.Equals("Operation", StringComparison.OrdinalIgnoreCase) &&
            action is "view" or "edit" or "delete";
        if (isTenantOperationRequest)
        {
            await next(context);
            return;
        }

        var code=$"SRMS.{controller.ToUpperInvariant()}.{action.ToUpperInvariant()}";
        if(!await access.AuthorizeAsync(userId,tenantId,code,action,context.RequestAborted))
        { context.Response.StatusCode=StatusCodes.Status403Forbidden; await context.Response.WriteAsJsonAsync(new{error="Tenant membership, module entitlement, or operation permission denied.",operation=code}); return; }
        await next(context);
    }

    private static bool IsSelfServiceUserRequest(string path, string method, Guid currentUserId)
    {
        if (currentUserId == Guid.Empty) return false;

        var normalized = path.TrimEnd('/');
        if (normalized.EndsWith("/User/password-policy", StringComparison.OrdinalIgnoreCase))
            return HttpMethods.IsGet(method);

        // PUT /api/v1.0/User — self profile update; ownership is enforced in the controller.
        if (normalized.EndsWith("/User", StringComparison.OrdinalIgnoreCase) && HttpMethods.IsPut(method))
            return true;

        var match = SelfServiceUserPath.Match(normalized);
        if (!match.Success) return false;

        if (!Guid.TryParse(match.Groups["userId"].Value, out var pathUserId) || pathUserId != currentUserId)
            return false;

        var action = match.Groups["action"].Value;
        if (string.IsNullOrEmpty(action))
            return HttpMethods.IsGet(method);
        if (action.Equals("change-password", StringComparison.OrdinalIgnoreCase))
            return HttpMethods.IsPost(method);
        if (action.Equals("profile-picture", StringComparison.OrdinalIgnoreCase))
            return HttpMethods.IsGet(method) || HttpMethods.IsPost(method) || HttpMethods.IsDelete(method);
        if (action.Equals("preferences", StringComparison.OrdinalIgnoreCase))
            return HttpMethods.IsGet(method) || HttpMethods.IsPut(method);
        if (action.Equals("account-profile", StringComparison.OrdinalIgnoreCase))
            return HttpMethods.IsGet(method);
        return false;
    }
}
