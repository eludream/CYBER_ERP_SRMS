using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.Workflows.Create;

public record CreateWorkflowRequest(int Step, string VoucherType, Guid StatusId);

public class CreateWorkflowRequestValidator : AbstractValidator<CreateWorkflowRequest>
{
    public CreateWorkflowRequestValidator()
    {
        RuleFor(x => x.VoucherType)
            .NotEmpty().WithMessage("Voucher Type is required.")
            .MaximumLength(100).WithMessage("Voucher Type must not exceed 100 characters.");

        RuleFor(x => x.StatusId)
            .NotEmpty().WithMessage("StatusId is required.");

        RuleFor(x => x.Step)
            .GreaterThan(0).WithMessage("Step must be greater than zero.");
    }
}