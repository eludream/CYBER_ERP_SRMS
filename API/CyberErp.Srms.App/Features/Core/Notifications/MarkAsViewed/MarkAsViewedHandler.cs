using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Notifications.MarkAsViewed;

public record NotificationResult(Guid Id);

public class MarkAsViewedHandler(
    IRepository<Notification> repository,
    IUnitOfWork unitOfWork,
    ILogger<MarkAsViewedHandler> logger)
    : IFeatureHandler<MarkAsViewedRequest, NotificationResult>
{
    public async Task<NotificationResult> Handle(MarkAsViewedRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Marking Notification as viewed with Id: {Id}", request.Id);

        var notification = await repository.GetAll()
            .FirstOrDefaultAsync(a => a.Id == request.Id, ct);

        if (notification == null)
        {
            logger.LogWarning("Notification not found for Id: {Id}", request.Id);
            throw new NotFoundException(nameof(Notification), request.Id.ToString());
        }

        notification.MarkAsViewed();
        repository.UpdateAsync(notification);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Notification marked as viewed successfully with ID: {Id}", notification.Id);

        return new NotificationResult(notification.Id);
    }
}