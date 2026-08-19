using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Workflows.DTOs;
using CyberErp.Srms.App.Features.Core.Workflows.GetAll;

namespace CyberErp.Srms.App.Features.Core.Workflows.GetAll
{
    public interface IGetAllWorkflowsRepository
    {
        Task<PaginatedResponse<WorkflowDto>> GetAllAsync(GetAllWorkflowsRequest request, CancellationToken ct = default);
    }
}
