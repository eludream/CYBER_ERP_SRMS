using CyberErp.Srms.App.Features.Core.Approvers.DTOs;

namespace CyberErp.Srms.App.Features.Core.Approvers.Approve
{
    public interface IApprove
    {
        Task ApproveAsync(ApproveDto dto);
    }
}

