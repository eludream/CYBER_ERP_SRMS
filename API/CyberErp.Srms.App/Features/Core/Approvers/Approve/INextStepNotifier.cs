using CyberErp.Srms.App.Features.Core.Approvers.DTOs;

namespace CyberErp.Srms.App.Features.Core.Approvers.Approve
{
    public interface INextStepNotifier
    {
        Task<Guid?> SendNextStepNotificationsAsync(ApproveDto dto, Guid currentStatusId);
    }
}

