using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Workflows.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Workflows.Delete;

public class DeleteWorkflowHandler(
    IRepository<Workflow> repository,
    IUnitOfWork unitOfWork,
    ILogger<DeleteWorkflowHandler> logger)
    : IFeatureHandler<DeleteWorkflowRequest, WorkflowResult?>
{
    public async Task<WorkflowResult?> Handle(DeleteWorkflowRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Deleting Workflow with Id: {Id}", request.Id);

        var workflow = await repository.GetAll()
            .Where(x => x.Id == request.Id)
            .FirstOrDefaultAsync();
        if (workflow == null)
        {
            logger.LogWarning("Workflow with ID: {Id} not found", request.Id);
            return null;
        }

        repository.Delete(workflow);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Workflow deleted successfully with ID: {Id}", workflow.Id);

        return new WorkflowResult
        {
            Id = workflow.Id
        };
    }
}