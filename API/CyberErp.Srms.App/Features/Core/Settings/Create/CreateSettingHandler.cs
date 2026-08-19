using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Settings.Create;

public record SettingResult(Guid Id);

public class CreateSettingHandler(
    IRepository<Setting> repository,
    IUnitOfWork unitOfWork,
    IValidator<CreateSettingRequest> validator,
    ILogger<CreateSettingHandler> logger)
    : IFeatureHandler<CreateSettingRequest, SettingResult>
{
    public async Task<SettingResult> Handle(CreateSettingRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var setting = Setting.Create(
            request.Type,
            request.SettingKey,
            request.SettingValue,
            request.Description);

        await repository.AddAsync(setting);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Setting created with Id: {Id}", setting.Id);

        return new SettingResult(setting.Id);
    }
}