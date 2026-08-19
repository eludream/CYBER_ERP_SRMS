using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.Approvers.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Approvers.Create;

public class CreateApproverHandler(
    IRepository<Approver> repository,
    IUnitOfWork unitOfWork,
    IValidator<CreateApproverRequest> validator,
    ILogger<CreateApproverHandler> logger)
    : IFeatureHandler<CreateApproverRequest, ApproverResult>
{
    public async Task<ApproverResult> Handle(CreateApproverRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var approver = Approver.Create(
            request.VoucherType,
            request.ApproverId,
            request.StatusId,
            request.Criteria);

        await repository.AddAsync(approver);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Approver created with Id: {Id}", approver.Id);

        return new ApproverResult { Id = approver.Id };
    }
}