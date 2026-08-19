using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.Workflows.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Workflows.Update;

public class UpdateWorkflowHandler(
    IRepository<Workflow> repository,
    IUnitOfWork unitOfWork,
    IValidator<UpdateWorkflowRequest> validator,
    ILogger<UpdateWorkflowHandler> logger)
    : IFeatureHandler<UpdateWorkflowRequest, WorkflowResult>
{
    public async Task<WorkflowResult> Handle(UpdateWorkflowRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var workflow = await repository.GetAll()
            .Where(x => x.Id == request.Id)
            .FirstOrDefaultAsync();
        if (workflow == null)
            throw new NotFoundException(nameof(Workflow), request.Id.ToString());

        workflow.Update(request.Step, request.VoucherType, request.StatusId);

        repository.UpdateAsync(workflow);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Workflow updated with Id: {Id}", workflow.Id);

        return new WorkflowResult
        {
            Id = workflow.Id
        };
    }
}