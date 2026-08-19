using CyberErp.Srms.App.Common;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;

namespace CyberErp.Srms.App.Features.Core.Modules.GetSystemResource;

public class GetSystemResourceHandler(IRepository<Module> repository)
    : IFeatureHandler<GetSystemResourceRequest, SystemResourceRouteDto?>
{
    public async Task<SystemResourceRouteDto?> Handle(GetSystemResourceRequest request, CancellationToken ct = default)
    {
        var module = await repository.GetAll()
            .Where(x => x.Code == SystemResourceSubSystem.Code || x.Code == SystemResourceSubSystem.LegacyCode)
            .OrderBy(x => x.Code == SystemResourceSubSystem.Code ? 0 : 1)
            .Select(x => new { x.Code, x.Abbreviation, x.Name, x.Description })
            .FirstOrDefaultAsync(ct);

        if (module is null || string.IsNullOrWhiteSpace(module.Abbreviation))
            return null;

        return new SystemResourceRouteDto(module.Code, module.Abbreviation.Trim(), module.Name, module.Description);
    }
}
