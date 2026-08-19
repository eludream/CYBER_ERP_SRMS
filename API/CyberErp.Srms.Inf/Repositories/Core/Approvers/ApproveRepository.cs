using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Approvers.Approve;
using CyberErp.Srms.App.Features.Core.Approvers.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Transactions;

namespace CyberErp.Srms.Inf.Repositories.Core.Approvers;

public class ApproveRepository(
    IRepository<VoucherTransaction> voucherTransactionRepository,
    IRepository<Notification> notificationRepository,
    VoucherStatusUpdater voucherStatusUpdater,
    INextStepNotifier nextStepNotifier,
    ILogger<ApproveRepository> logger) : IApproveRepository
{
    private readonly IRepository<VoucherTransaction> _voucherTransactionRepository = voucherTransactionRepository;
    private readonly IRepository<Notification> _notificationRepository = notificationRepository;
    private readonly VoucherStatusUpdater _voucherStatusUpdater = voucherStatusUpdater;
    private readonly INextStepNotifier _nextStepNotifier = nextStepNotifier;
    private readonly ILogger<ApproveRepository> _logger = logger;

    public async Task ApproveAsync(ApproveDto dto)
    {
        _logger.LogInformation("Approving voucher {VoucherNumber}", dto.VoucherNumber);

        using var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);

        var notification = await _notificationRepository
            .GetAll()
            .FirstOrDefaultAsync(a => a.Id == dto.Id);
        if (notification != null)
        {
            notification.MarkAsResponded();
            notification.MarkAsViewed();
            _notificationRepository.UpdateAsync(notification);
        }

        var transaction = VoucherTransaction.Create(
            dto.VoucherType,
            dto.ApproverId,
            dto.VoucherId,
            dto.StatusId,
            dto.VoucherNumber,
            dto.Date.ToDateTimeUtc(),
            "");

        await _voucherTransactionRepository.AddAsync(transaction);
        await _voucherStatusUpdater.UpdateVoucherStatus(dto.VoucherType, dto.VoucherId, dto.StatusId);

        var nextStatusId = await _nextStepNotifier.SendNextStepNotificationsAsync(dto, dto.StatusId);

        await _voucherTransactionRepository.SaveChangesAsync();

        scope.Complete();

        _logger.LogInformation("Approval completed for voucher {VoucherNumber}", dto.VoucherNumber);
    }
}
