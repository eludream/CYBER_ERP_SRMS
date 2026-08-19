using CyberErp.Srms.App.Features.Core.Approvers.DTOs;

namespace CyberErp.Srms.App.Features.Core.Approvers.Reject
{
    public interface IRejectRepository
    {
        Task RejectAsync(RejectDto dto);
    }
}

