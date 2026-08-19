using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.Approvers.DTOs;

namespace CyberErp.Srms.App.Features.Core.Approvers.GetAll;

public class GetAllApproversHandler(IGetAllApproversRepository repository)
    : IFeatureHandler<GetAllApproversRequest, PaginatedResponse<GetApproverDto>>
{
    public async Task<PaginatedResponse<GetApproverDto>> Handle(GetAllApproversRequest request, CancellationToken ct = default)
    {
        return await repository.GetAllAsync(request, ct);
    }
}
