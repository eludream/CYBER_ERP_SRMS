using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.DocumentSettings.Create;

public record CreateDocumentSettingRequest(
    string VoucherType,
    string? Prefix = null,
    string? Sufix = null,
    string? Year = null,
    int LastNumber = 0);

public class CreateDocumentSettingRequestValidator : AbstractValidator<CreateDocumentSettingRequest>
{
    public CreateDocumentSettingRequestValidator()
    {
        RuleFor(x => x.VoucherType)
            .NotEmpty().WithMessage("Voucher Type is required.")
            .MaximumLength(100).WithMessage("Voucher Type must not exceed 100 characters.");

        RuleFor(x => x.Prefix)
            .MaximumLength(50).WithMessage("Prefix must not exceed 50 characters.");

        RuleFor(x => x.Sufix)
            .MaximumLength(50).WithMessage("Suffix must not exceed 50 characters.");

        RuleFor(x => x.Year)
            .MaximumLength(10).WithMessage("Year must not exceed 10 characters.");

        RuleFor(x => x.LastNumber)
            .GreaterThanOrEqualTo(0).WithMessage("Last Number must be greater than or equal to 0.");
    }
}