using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.Inf.Repositories.Core.Approvers;

public class VoucherStatusUpdater(
    IRepository<Workflow> workflowRepository,
    ILogger<VoucherStatusUpdater> logger)
{
    private readonly IRepository<Workflow> _workflowRepository = workflowRepository;
    private readonly ILogger<VoucherStatusUpdater> _logger = logger;

    public async Task UpdateVoucherStatus(string voucherType, Guid voucherId, Guid statusId, bool allowLowerStep = false)
    {
        var currentWorkflow = await _workflowRepository.GetAll()
            .Where(w => w.VoucherType == voucherType)
            .OrderByDescending(w => w.Step)
            .FirstOrDefaultAsync();

        var newWorkflow = await _workflowRepository.GetAll()
            .FirstOrDefaultAsync(w => w.VoucherType == voucherType && w.StatusId == statusId);

        if (newWorkflow == null)
        {
            _logger.LogWarning(
                "Workflow not found for voucher type {VoucherType} and status {StatusId}",
                voucherType,
                statusId);
            return;
        }

        if (!allowLowerStep && currentWorkflow != null && newWorkflow.Step < currentWorkflow.Step)
        {
            _logger.LogWarning(
                "Cannot update voucher {VoucherId} to lower step status. Current step: {CurrentStep}, New step: {NewStep}",
                voucherId,
                currentWorkflow.Step,
                newWorkflow.Step);
            return;
        }

        _logger.LogInformation(
            "Voucher {VoucherId} status update validated for type {VoucherType}.",
            voucherId,
            voucherType);
    }
}
