using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.App.Features.Core.Approvers.DTOs;
using CyberErp.Srms.App.Features.Core.Approvers.Reject;
using CyberErp.Srms.Dom.Constants;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Transactions;

namespace CyberErp.Srms.Inf.Repositories.Core.Approvers;

public class RejectRepository(
    IRepository<VoucherTransaction> voucherTransactionRepository,
    IRepository<Notification> notificationRepository,
    VoucherStatusUpdater voucherStatusUpdater,
    IStatus status,
    ILogger<RejectRepository> logger) : IRejectRepository
{
    private readonly IRepository<VoucherTransaction> _voucherTransactionRepository = voucherTransactionRepository;
    private readonly IRepository<Notification> _notificationRepository = notificationRepository;
    private readonly VoucherStatusUpdater _voucherStatusUpdater = voucherStatusUpdater;
    private readonly ILogger<RejectRepository> _logger = logger;
    private readonly IStatus _status = status;

    public async Task RejectAsync(RejectDto dto)
    {
        _logger.LogInformation("Rejecting voucher {VoucherId}", dto.VoucherId);

        using var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);

        var statusId = await _status.GetStatusIdAsync(Dom.Constants.VoucherStatus.Rejected);

        var notification = await _notificationRepository.GetAll().FirstOrDefaultAsync(a => a.Id == dto.Id);
        if (notification != null)
        {
            notification.MarkAsResponded();
            notification.MarkAsViewed();
            notification.UpdateStatus(statusId);
            _notificationRepository.UpdateAsync(notification);
        }

        var transaction = VoucherTransaction.Create(
            dto.VoucherType,
            dto.ApproverId,
            dto.VoucherId,
            statusId,
            dto.VoucherNumber,
            DateTime.Now,
            dto.Remark);

        await _voucherTransactionRepository.AddAsync(transaction);
        await _voucherStatusUpdater.UpdateVoucherStatus(dto.VoucherType, dto.VoucherId, statusId, allowLowerStep: true);

        await _voucherTransactionRepository.SaveChangesAsync();

        scope.Complete();

        _logger.LogInformation("Rejection completed for voucher {VoucherNumber}", dto.VoucherNumber);
    }
}
