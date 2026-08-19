using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Notifications.Create;

public record NotificationResult(Guid Id);

public class CreateNotificationHandler(
    IRepository<Notification> repository,
    IUnitOfWork unitOfWork,
    IValidator<CreateNotificationRequest> validator,
    ILogger<CreateNotificationHandler> logger)
    : IFeatureHandler<CreateNotificationRequest, NotificationResult>
{
    public async Task<NotificationResult> Handle(CreateNotificationRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var notification = Notification.Create(
            request.VoucherType,
            request.ApproverId,
            request.VoucherId,
            request.VoucherNumber,
            request.Date,
            request.Criteria,
            request.StatusId,
            request.Message);

        await repository.AddAsync(notification);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Notification created with Id: {Id}", notification.Id);

        return new NotificationResult(notification.Id);
    }
}