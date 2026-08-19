using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Settings.Update;

public record SettingResult(Guid Id);

public class UpdateSettingHandler(
    IRepository<Setting> repository,
    IUnitOfWork unitOfWork,
    IValidator<UpdateSettingRequest> validator,
    ILogger<UpdateSettingHandler> logger)
    : IFeatureHandler<UpdateSettingRequest, SettingResult>
{
    public async Task<SettingResult> Handle(UpdateSettingRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var setting = await repository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (setting == null)
        {
            logger.LogWarning("Setting with Id: {Id} not found", request.Id);
            throw new NotFoundException(nameof(Setting), request.Id.ToString());
        }

        setting.Update(
            request.Type,
            request.SettingKey,
            request.SettingValue,
            request.Description);

        repository.UpdateAsync(setting);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Setting updated with Id: {Id}", setting.Id);

        return new SettingResult(setting.Id);
    }
}