using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.Notifications.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Notifications.GetById;

public class GetNotificationByIdHandler(
    IRepository<Notification> repository,
    ILogger<GetNotificationByIdHandler> logger)
    : IFeatureHandler<GetNotificationByIdRequest, GetNotificationDto>
{
    public async Task<GetNotificationDto> Handle(GetNotificationByIdRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Getting Notification with ID: {Id}", request.Id);

        var notification = await repository.GetAll()
            .Include(n => n.Approver)
            .Include(n => n.Status)
            .FirstOrDefaultAsync(n => n.Id == request.Id, ct);

        if (notification == null)
        {
            logger.LogWarning("Notification with ID {Id} not found", request.Id);
            throw new NotFoundException(nameof(Notification), request.Id.ToString());
        }

        return new GetNotificationDto
        {
            Id = notification.Id,
            VoucherType = notification.VoucherType,
            ApproverId = notification.ApproverId,
            VoucherId = notification.VoucherId,
            VoucherNumber = notification.VoucherNumber,
            Date = notification.Date,
            Criteria = notification.Criteria,
            Approver = notification.Approver != null ? notification.Approver.FullName : string.Empty,
            Status = notification.Status != null ? notification.Status.Name : string.Empty,
            IsResponded = notification.IsResponded,
            IsEmailed = notification.IsEmailed,
            IsViewed = notification.IsViewed,
            IsSms = notification.IsSms,
            StatusId = notification.StatusId,
            Message = notification.Message
        };
    }
}