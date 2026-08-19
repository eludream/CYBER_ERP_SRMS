using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.DocumentSettings.Update;

public record UpdateDocumentSettingRequest(
    Guid Id,
    string? VoucherType = null,
    string? Prefix = null,
    string? Sufix = null,
    string? Year = null,
    int? LastNumber = null);

public class UpdateDocumentSettingRequestValidator : AbstractValidator<UpdateDocumentSettingRequest>
{
    public UpdateDocumentSettingRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.");

        RuleFor(x => x.VoucherType)
            .NotEmpty().WithMessage("Voucher Type is required.")
            .MaximumLength(100).WithMessage("Voucher Type must not exceed 100 characters.")
            .When(x => x.VoucherType != null);

        RuleFor(x => x.Prefix)
            .MaximumLength(50).WithMessage("Prefix must not exceed 50 characters.");

        RuleFor(x => x.Sufix)
            .MaximumLength(50).WithMessage("Suffix must not exceed 50 characters.");

        RuleFor(x => x.Year)
            .MaximumLength(10).WithMessage("Year must not exceed 10 characters.");

        RuleFor(x => x.LastNumber)
            .GreaterThanOrEqualTo(0).WithMessage("Last Number must be greater than or equal to 0.")
            .When(x => x.LastNumber.HasValue);
    }
}