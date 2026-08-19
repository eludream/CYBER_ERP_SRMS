using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Settings.Delete;

public record SettingResult(Guid Id);

public class DeleteSettingHandler(
    IRepository<Setting> repository,
    IUnitOfWork unitOfWork,
    ILogger<DeleteSettingHandler> logger)
    : IFeatureHandler<DeleteSettingRequest, SettingResult>
{
    public async Task<SettingResult> Handle(DeleteSettingRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Deleting Setting with Id: {Id}", request.Id);

        var setting = await repository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (setting == null)
        {
            logger.LogWarning("Setting with Id: {Id} not found", request.Id);
            throw new NotFoundException(nameof(Setting), request.Id.ToString());
        }

        repository.Delete(setting);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Setting deleted successfully with Id: {Id}", setting.Id);

        return new SettingResult(setting.Id);
    }
}