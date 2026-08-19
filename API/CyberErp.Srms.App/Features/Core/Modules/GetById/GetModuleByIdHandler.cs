using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Modules.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Modules.GetById;

public class GetModuleByIdHandler(
    IRepository<Module> repository,
    ILogger<GetModuleByIdHandler> logger)
    : IFeatureHandler<GetModuleByIdRequest, GetModuleDto?>
{
    public async Task<GetModuleDto?> Handle(GetModuleByIdRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Getting Module with ID: {Id}", request.Id);

        var module = await repository.GetAll()
            .Where(x => x.Id == request.Id)
            .Select(x => new GetModuleDto
            {
                Id = x.Id,
                Code = x.Code,
                SubSystem = x.SubSystem,
                Name = x.Name,
                Abbreviation = x.Abbreviation,
                Description = x.Description,
                LandingPath = x.LandingPath,
                Icon = x.Icon,
                DisplayOrder = x.DisplayOrder,
                IsActive = x.IsActive,
                ModuleCount = 0,
                OperationCount = 0
            })
            .FirstOrDefaultAsync(ct);

        return module;
    }
}
