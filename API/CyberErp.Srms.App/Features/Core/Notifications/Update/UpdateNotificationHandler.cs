using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Notifications.Update;

public record NotificationResult(Guid Id);

public class UpdateNotificationHandler(
    IRepository<Notification> repository,
    IUnitOfWork unitOfWork,
    IValidator<UpdateNotificationRequest> validator,
    ILogger<UpdateNotificationHandler> logger)
    : IFeatureHandler<UpdateNotificationRequest, NotificationResult>
{
    public async Task<NotificationResult> Handle(UpdateNotificationRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var notification = await repository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (notification == null)
        {
            logger.LogWarning("Notification with Id: {Id} not found", request.Id);
            throw new NotFoundException(nameof(Notification), request.Id.ToString());
        }

        notification.Update(
            request.VoucherType,
            request.ApproverId,
            request.VoucherId,
            request.VoucherNumber,
            request.Date,
            request.Criteria,
            request.IsResponded,
            request.IsEmailed,
            request.IsViewed,
            request.IsSms,
            request.StatusId,
            request.Message);

        repository.UpdateAsync(notification);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Notification updated with Id: {Id}", notification.Id);

        return new NotificationResult(notification.Id);
    }
}