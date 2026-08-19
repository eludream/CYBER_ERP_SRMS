using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NodaTime;
using System.Linq;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Approvers.Approve;
using CyberErp.Srms.App.Features.Core.Approvers.DTOs;

namespace CyberErp.Srms.Inf.Repositories.Core.Approvers
{
    public class NextStepNotifier(
        IRepository<Approver> approverRepository,
        IRepository<Notification> notificationRepository,
        IRepository<Workflow> workflowRepository,
        ILogger<NextStepNotifier> logger) : INextStepNotifier
    {
        private readonly IRepository<Approver> _approverRepository = approverRepository;
        private readonly IRepository<Notification> _notificationRepository = notificationRepository;
        private readonly IRepository<Workflow> _workflowRepository = workflowRepository;
        private readonly ILogger<NextStepNotifier> _logger = logger;

        public async Task<Guid?> SendNextStepNotificationsAsync(ApproveDto dto, Guid currentStatusId)
        {
            // Find current workflow step
            var currentWorkflow = await _workflowRepository.GetAll()
                .Where(w => w.VoucherType == dto.VoucherType && w.StatusId == currentStatusId)
                .FirstOrDefaultAsync();

            if (currentWorkflow == null)
            {
                _logger.LogWarning("No current workflow found for voucher type {VoucherType} and status {StatusId}", dto.VoucherType, currentStatusId);
                return null;
            }

            // Find next step from Workflow
            var nextWorkflow = await _workflowRepository.GetAll()
                .Where(w => w.VoucherType == dto.VoucherType && w.Step == currentWorkflow.Step + 1)
                .FirstOrDefaultAsync();

            if (nextWorkflow == null)
            {
                _logger.LogInformation("No next workflow step found for voucher {VoucherNumber}", dto.VoucherNumber);
                return null;
            }

            // Find approvers for next step
            var nextApprovers = await _approverRepository.GetAll()
                .Where(a => a.VoucherType == dto.VoucherType && a.StatusId == nextWorkflow.StatusId)
                .ToListAsync();

            // Add Notifications for next approvers
            foreach (var approver in nextApprovers)
            {
                var message = $"Approval required for voucher {dto.VoucherNumber}";
                var notification = Notification.Create(
                    dto.VoucherType,
                    approver.ApproverId,
                    dto.VoucherId,
                    dto.VoucherNumber,
                    dto.Date.ToDateTimeUtc(),
                    dto.Criteria,
                    nextWorkflow.StatusId,
                    message);

                await _notificationRepository.AddAsync(notification);
            }

            await _notificationRepository.SaveChangesAsync();

            _logger.LogInformation("Sent notifications to {Count} next step approvers for voucher {VoucherNumber}", nextApprovers.Count, dto.VoucherNumber);

            return nextWorkflow.StatusId;
        }
    }
}
