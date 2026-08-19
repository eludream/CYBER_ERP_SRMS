using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Notifications.Delete;

public record NotificationResult(Guid Id);

public class DeleteNotificationHandler(
    IRepository<Notification> repository,
    IUnitOfWork unitOfWork,
    ILogger<DeleteNotificationHandler> logger)
    : IFeatureHandler<DeleteNotificationRequest, NotificationResult>
{
    public async Task<NotificationResult> Handle(DeleteNotificationRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Deleting Notification with Id: {Id}", request.Id);

        var notification = await repository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (notification == null)
        {
            logger.LogWarning("Notification with Id: {Id} not found", request.Id);
            throw new NotFoundException(nameof(Notification), request.Id.ToString());
        }

        repository.Delete(notification);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Notification deleted successfully with Id: {Id}", notification.Id);

        return new NotificationResult(notification.Id);
    }
}