using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.Workflows.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Workflows.Create;

public class CreateWorkflowHandler(
    IRepository<Workflow> repository,
    IUnitOfWork unitOfWork,
    IValidator<CreateWorkflowRequest> validator,
    ILogger<CreateWorkflowHandler> logger)
    : IFeatureHandler<CreateWorkflowRequest, WorkflowResult>
{
    public async Task<WorkflowResult> Handle(CreateWorkflowRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var workflow = Workflow.Create(request.Step, request.VoucherType, request.StatusId);

        await repository.AddAsync(workflow);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Workflow created with Id: {Id}", workflow.Id);

        return new WorkflowResult
        {
            Id = workflow.Id
        };
    }
}