using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Tenants.DTOs;
using CyberErp.Srms.App.Features.Core.Tenants.GetAll;

namespace CyberErp.Srms.App.Features.Core.Tenants.GetAll
{
    public interface IGetAllTenantsRepository
    {
        Task<PaginatedResponse<TenantDto>> GetAllAsync(GetAllTenantsRequest request, CancellationToken ct = default);
    }
}
