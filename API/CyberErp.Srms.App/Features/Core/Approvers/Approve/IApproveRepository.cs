using CyberErp.Srms.App.Features.Core.Approvers.DTOs;

namespace CyberErp.Srms.App.Features.Core.Approvers.Approve
{
    public interface IApproveRepository
    {
        Task ApproveAsync(ApproveDto dto);
    }
}

