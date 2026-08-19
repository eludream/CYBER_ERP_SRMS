using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.Notifications.Update;

public record UpdateNotificationRequest(
    Guid Id,
    string VoucherType,
    Guid ApproverId,
    Guid VoucherId,
    string VoucherNumber,
    DateTime Date,
    string Criteria,
    bool IsResponded,
    bool IsEmailed,
    bool IsViewed,
    bool IsSms,
    Guid StatusId,
    string Message);

public class UpdateNotificationRequestValidator : AbstractValidator<UpdateNotificationRequest>
{
    public UpdateNotificationRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.");

        RuleFor(x => x.VoucherType)
            .NotEmpty().WithMessage("VoucherType is required.")
            .MaximumLength(100).WithMessage("VoucherType must not exceed 100 characters.");

        RuleFor(x => x.ApproverId)
            .NotEmpty().WithMessage("ApproverId is required.");

        RuleFor(x => x.VoucherId)
            .NotEmpty().WithMessage("VoucherId is required.");

        RuleFor(x => x.VoucherNumber)
            .NotEmpty().WithMessage("VoucherNumber is required.")
            .MaximumLength(100).WithMessage("VoucherNumber must not exceed 100 characters.");

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("Date is required.");

        RuleFor(x => x.Criteria)
            .MaximumLength(500).WithMessage("Criteria must not exceed 500 characters.");

        RuleFor(x => x.StatusId)
            .NotEmpty().WithMessage("StatusId is required.");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Message is required.")
            .MaximumLength(500).WithMessage("Message must not exceed 500 characters.");
    }
}