using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.Settings.Create;

public record CreateSettingRequest(
    string? Type,
    string SettingKey,
    string? SettingValue = null,
    string? Description = null);

public class CreateSettingRequestValidator : AbstractValidator<CreateSettingRequest>
{
    public CreateSettingRequestValidator()
    {
        RuleFor(x => x.SettingKey)
            .NotEmpty().WithMessage("SettingKey is required.")
            .MaximumLength(100).WithMessage("SettingKey must not exceed 100 characters.");

        RuleFor(x => x.Type)
            .MaximumLength(50).WithMessage("Type must not exceed 50 characters.");

        RuleFor(x => x.SettingValue)
            .MaximumLength(500).WithMessage("SettingValue must not exceed 500 characters.");
    }
}