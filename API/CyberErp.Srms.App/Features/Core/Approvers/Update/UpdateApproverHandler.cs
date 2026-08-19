using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.Approvers.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Approvers.Update;

public class UpdateApproverHandler(
    IRepository<Approver> repository,
    IUnitOfWork unitOfWork,
    IValidator<UpdateApproverRequest> validator,
    ILogger<UpdateApproverHandler> logger)
    : IFeatureHandler<UpdateApproverRequest, ApproverResult>
{
    public async Task<ApproverResult> Handle(UpdateApproverRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var approver = await repository.GetAll()
            .Where(x => x.Id == request.Id)
            .FirstOrDefaultAsync();
        if (approver == null)
            throw new NotFoundException(nameof(Approver), request.Id.ToString());

        approver.Update(
            request.VoucherType,
            request.ApproverId,
            request.StatusId,
            request.Criteria);

        repository.UpdateAsync(approver);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Approver updated with Id: {Id}", approver.Id);

        return new ApproverResult { Id = approver.Id };
    }
}