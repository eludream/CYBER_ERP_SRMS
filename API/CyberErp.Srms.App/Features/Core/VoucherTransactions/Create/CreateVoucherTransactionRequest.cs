using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.VoucherTransactions.Create;

public record CreateVoucherTransactionRequest(
    string VoucherType,
    Guid ApproverId,
    Guid VoucherId,
    Guid StatusId,
    string VoucherNumber,
    DateTime Date);

public class CreateVoucherTransactionRequestValidator : AbstractValidator<CreateVoucherTransactionRequest>
{
    public CreateVoucherTransactionRequestValidator()
    {
        RuleFor(x => x.VoucherType)
            .NotEmpty().WithMessage("VoucherType is required.")
            .MaximumLength(100).WithMessage("VoucherType must not exceed 100 characters.");

        RuleFor(x => x.ApproverId)
            .NotEmpty().WithMessage("ApproverId is required.");

        RuleFor(x => x.VoucherId)
            .NotEmpty().WithMessage("VoucherId is required.");

        RuleFor(x => x.StatusId)
            .NotEmpty().WithMessage("StatusId is required.");

        RuleFor(x => x.VoucherNumber)
            .NotEmpty().WithMessage("VoucherNumber is required.")
            .MaximumLength(100).WithMessage("VoucherNumber must not exceed 100 characters.");

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("Date is required.");
    }
}