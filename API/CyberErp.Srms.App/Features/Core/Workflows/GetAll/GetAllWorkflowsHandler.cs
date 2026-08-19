using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.Workflows.DTOs;

namespace CyberErp.Srms.App.Features.Core.Workflows.GetAll;

public class GetAllWorkflowsHandler(IGetAllWorkflowsRepository repository)
    : IFeatureHandler<GetAllWorkflowsRequest, PaginatedResponse<WorkflowDto>>
{
    public async Task<PaginatedResponse<WorkflowDto>> Handle(GetAllWorkflowsRequest request, CancellationToken ct = default)
    {
        return await repository.GetAllAsync(request, ct);
    }
}
