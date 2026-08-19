using Finbuckle.MultiTenant.Abstractions;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CyberErp.Srms.Inf.MultiTenant
{
    /// <summary>
    /// Resolves tenant only from a validated authentication principal.
    /// </summary>
    public class HybridTenantStrategy : IMultiTenantStrategy
    {
        public int Priority => 0;

        public Task<string?> GetIdentifierAsync(object context)
        {
            if (context is not HttpContext httpContext)
            {
                return Task.FromResult<string?>(null);
            }

            var user = httpContext.User;
            if (user?.Identity?.IsAuthenticated == true)
            {
                var tenantClaim = user.FindFirst("TenantId");
                if (tenantClaim != null && !string.IsNullOrEmpty(tenantClaim.Value))
                {
                    return Task.FromResult<string?>(tenantClaim.Value);
                }
            }

            return Task.FromResult<string?>(null);
        }
    }
}
