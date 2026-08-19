using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Workflows.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Workflows.GetById;

public class GetWorkflowByIdHandler(
    IRepository<Workflow> repository,
    ILogger<GetWorkflowByIdHandler> logger)
    : IFeatureHandler<GetWorkflowByIdRequest, WorkflowDto?>
{
    public async Task<WorkflowDto?> Handle(GetWorkflowByIdRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Getting Workflow with ID: {Id}", request.Id);

        var workflow = await repository.GetAll()
            .Where(x => x.Id == request.Id)
            .Select(x => new WorkflowDto
            {
                Id = x.Id,
                VoucherType = x.VoucherType,
                StatusId = x.StatusId,
                Step = x.Step,
                Status = x.Status.Name
            })
            .FirstOrDefaultAsync(ct);

        return workflow;
    }
}