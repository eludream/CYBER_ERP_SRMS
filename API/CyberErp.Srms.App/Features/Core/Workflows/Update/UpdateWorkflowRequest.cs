using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.Workflows.Update;

public record UpdateWorkflowRequest(Guid Id, int Step, string VoucherType, Guid StatusId);

public class UpdateWorkflowRequestValidator : AbstractValidator<UpdateWorkflowRequest>
{
    public UpdateWorkflowRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.");

        RuleFor(x => x.VoucherType)
            .NotEmpty().WithMessage("Voucher Type is required.")
            .MaximumLength(100).WithMessage("Voucher Type must not exceed 100 characters.");

        RuleFor(x => x.StatusId)
            .NotEmpty().WithMessage("StatusId is required.");

        RuleFor(x => x.Step)
            .GreaterThan(0).WithMessage("Step must be greater than zero.");
    }
}