using CyberErp.Srms.App.Common;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.Modules.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Modules.Update;

public class UpdateModuleHandler(
    IRepository<Module> repository,
    IUnitOfWork unitOfWork,
    IValidator<UpdateModuleRequest> validator,
    ILogger<UpdateModuleHandler> logger)
    : IFeatureHandler<UpdateModuleRequest, ModuleResult>
{
    public async Task<ModuleResult> Handle(UpdateModuleRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var module = await repository.GetAll()
            .Where(x => x.Id == request.Id)
            .FirstOrDefaultAsync();
        if (module == null)
            throw new NotFoundException(nameof(Module), request.Id.ToString());

        var landingPath = SystemResourceSubSystem.IsMatch(module.Code)
            ? SystemResourceSubSystem.RouteBasePath(request.Abbreviation)
            : request.LandingPath;
        module.Update(module.Code, request.SubSystem, request.Name, request.Description, landingPath,
            request.Icon, request.DisplayOrder, module.IsActive, request.Abbreviation); // Tenant access is controlled by its entitlement row.

        repository.UpdateAsync(module);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Module updated with Id: {Id}", module.Id);

        return new ModuleResult
        {
            Id = module.Id,
            Code = module.Code,
            SubSystem = module.SubSystem,
            Name = module.Name,
            Abbreviation = module.Abbreviation,
            Description = module.Description,
            LandingPath = module.LandingPath,
            Icon = module.Icon,
            DisplayOrder = module.DisplayOrder,
            IsActive = module.IsActive,
            CreatedBy = module.CreatedBy,
            CreatedAt = module.CreatedAt.InUtc().ToString(),
            UpdatedBy = module.UpdatedBy,
            UpdatedAt = module.UpdatedAt?.InUtc().ToString()
        };
    }
}
