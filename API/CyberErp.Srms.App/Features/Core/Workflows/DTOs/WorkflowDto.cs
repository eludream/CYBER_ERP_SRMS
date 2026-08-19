using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.Workflows.DTOs
{
    public class WorkflowDtoValidator : AbstractValidator<WorkflowDto>
    {
        public WorkflowDtoValidator()
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

    public class UpdateWorkflowDtoValidator : AbstractValidator<UpdateWorkflowDto>
    {
        public UpdateWorkflowDtoValidator()
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

    public class WorkflowDto
    {
        public Guid Id { get; set; }
        public string VoucherType { get; set; } = string.Empty;
        public Guid StatusId { get; set; }
        public int Step { get; set; }
        public string? Status { get; set; }
    }

    public class UpdateWorkflowDto
    {
        public Guid Id { get; set; }
        public string VoucherType { get; set; } = string.Empty;
        public Guid StatusId { get; set; }
        public int Step { get; set; }
    }

    public class WorkflowResult
    {
        public Guid Id { get; set; }
    }
}

