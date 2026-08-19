using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Approvers.DTOs;
using CyberErp.Srms.App.Features.Core.Approvers.GetAll;

namespace CyberErp.Srms.App.Features.Core.Approvers.GetAll
{
    public interface IGetAllApproversRepository
    {
        Task<PaginatedResponse<GetApproverDto>> GetAllAsync(GetAllApproversRequest request, CancellationToken ct = default);
    }
}
