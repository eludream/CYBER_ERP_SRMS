using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Workflows.DTOs;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Workflows.GetAll;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace CyberErp.Srms.Inf.Repositories.Core.Workflows;

public class GetAllWorkflowsRepository(
    IRepository<Workflow> workflowsRepository,
    ILogger<GetAllWorkflowsRepository> logger) : IGetAllWorkflowsRepository
{
    private readonly IRepository<Workflow> _workflowsRepository = workflowsRepository;
    private readonly ILogger<GetAllWorkflowsRepository> _logger = logger;

    public async Task<PaginatedResponse<WorkflowDto>> GetAllAsync(GetAllWorkflowsRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation("Getting all Workflows");

        var query = _workflowsRepository.GetAll();

        if (!string.IsNullOrWhiteSpace(request.SearchText))
        {
            query = query.Where(x => x.VoucherType.Contains(request.SearchText));
        }

        var totalCount = await query.CountAsync(ct);

        query = query.OrderByDescending(x => x.CreatedAt);

        var skip = int.Parse(request.Skip ?? "0");
        var take = int.Parse(request.Take ?? "10");

        var items = await query
            .Skip(skip)
            .Take(take)
            .Select(x => new WorkflowDto
            {
                Id = x.Id,
                VoucherType = x.VoucherType,
                StatusId = x.StatusId,
                Step = x.Step,
                Status = x.Status.Name
            })
            .ToListAsync(ct);

        return new PaginatedResponse<WorkflowDto>
        {
            Total = totalCount,
            Data = items
        };
    }
}