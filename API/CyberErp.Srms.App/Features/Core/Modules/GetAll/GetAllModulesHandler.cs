using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.Modules.DTOs;

namespace CyberErp.Srms.App.Features.Core.Modules.GetAll;

public class GetAllModulesHandler(IGetAllModuleRepository repository)
    : IFeatureHandler<GetAllModulesRequest, PaginatedResponse<GetModuleDto>>
{
    public async Task<PaginatedResponse<GetModuleDto>> Handle(GetAllModulesRequest request, CancellationToken ct = default)
    {
        return await repository.GetAllAsync(request, ct);
    }
}
