using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using CyberErp.Srms.App.Features.Core.Approvers.Approve;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Approvers.DTOs;
using NodaTime;

namespace CyberErp.Srms.Inf.Repositories.Core.Approvers
{
    public class VoucherNotificationService(
        INextStepNotifier nextStepNotifier,
        IRepository<Notification> notificationRepository)
    {
        private readonly INextStepNotifier _nextStepNotifier = nextStepNotifier;
        private readonly IRepository<Notification> _notificationRepository = notificationRepository;

        public async Task NotifyOnCreationAsync(
            string voucherType,
            Guid voucherId,
            string voucherNumber,
            Instant date,
            Guid statusId,
            string criteria)
        {
            var approveDto = new ApproveDto
            {
                VoucherType = voucherType,
                ApproverId = Guid.Empty, // Not used for notifications
                VoucherId = voucherId,
                VoucherNumber = voucherNumber,
                Date = date,
                StatusId = statusId,
                Criteria = criteria,
                IsResponded = false,
                IsEmailed = false,
                IsViewed = false,
                IsSms = false
            };

            await _nextStepNotifier.SendNextStepNotificationsAsync(approveDto, statusId);
        }

        public async Task DeleteUnrespondedNotificationsAsync(Guid voucherId)
        {
            var unrespondedNotifications = await _notificationRepository.GetAll()
                .Where(n => n.VoucherId == voucherId && !n.IsResponded)
                .ToListAsync();
            _notificationRepository.RemoveRange(unrespondedNotifications);
            await _notificationRepository.SaveChangesAsync();
        }
    }
}
