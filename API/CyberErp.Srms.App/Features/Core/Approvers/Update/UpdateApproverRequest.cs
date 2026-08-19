using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.Approvers.Update;

public record UpdateApproverRequest(Guid Id, string VoucherType, Guid ApproverId, Guid StatusId, string? Criteria);

public class UpdateApproverRequestValidator : AbstractValidator<UpdateApproverRequest>
{
    public UpdateApproverRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.");

        RuleFor(x => x.VoucherType)
            .NotEmpty().WithMessage("VoucherType is required.")
            .MaximumLength(100).WithMessage("VoucherType must not exceed 100 characters.");

        RuleFor(x => x.ApproverId)
            .NotEmpty().WithMessage("ApproverId is required.");

        RuleFor(x => x.StatusId)
            .NotEmpty().WithMessage("StatusId is required.");

        RuleFor(x => x.Criteria)
            .MaximumLength(500).WithMessage("Criteria must not exceed 500 characters.");
    }
}