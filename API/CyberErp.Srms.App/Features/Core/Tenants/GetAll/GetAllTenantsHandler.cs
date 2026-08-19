using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.Tenants.DTOs;
using CyberErp.Srms.App.Features.Core.Tenants.GetAll;

namespace CyberErp.Srms.App.Features.Core.Tenants.GetAll;

public class GetAllTenantsHandler(IGetAllTenantsRepository repository)
    : IFeatureHandler<GetAllTenantsRequest, PaginatedResponse<TenantDto>>
{
    public async Task<PaginatedResponse<TenantDto>> Handle(GetAllTenantsRequest request, CancellationToken ct = default)
    {
        var result = await repository.GetAllAsync(request, ct);
        return result;
    }
}
