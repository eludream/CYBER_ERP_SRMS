using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.Approvers.Create;

public record CreateApproverRequest(string VoucherType, Guid ApproverId, Guid StatusId, string? Criteria);

public class CreateApproverRequestValidator : AbstractValidator<CreateApproverRequest>
{
    public CreateApproverRequestValidator()
    {
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