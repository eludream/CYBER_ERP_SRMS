using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.Modules.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Modules.Create;

public class CreateModuleHandler(
    IRepository<Module> repository,
    IUnitOfWork unitOfWork,
    IValidator<CreateModuleRequest> validator,
    ILogger<CreateModuleHandler> logger)
    : IFeatureHandler<CreateModuleRequest, ModuleResult>
{
    public async Task<ModuleResult> Handle(CreateModuleRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var module = Module.Create(request.Code, request.SubSystem, request.Name, request.Description,
            request.LandingPath, request.Icon, request.DisplayOrder, request.IsActive, request.Abbreviation);

        await repository.AddAsync(module);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Module created with Id: {Id}", module.Id);

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
            CreatedAt = module.CreatedAt.InUtc().ToString()
        };
    }
}
