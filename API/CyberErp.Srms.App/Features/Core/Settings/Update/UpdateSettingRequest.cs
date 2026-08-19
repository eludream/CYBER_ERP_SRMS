using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.Settings.Update;

public record UpdateSettingRequest(
    Guid Id,
    string? Type,
    string SettingKey,
    string? SettingValue,
    string? Description);

public class UpdateSettingRequestValidator : AbstractValidator<UpdateSettingRequest>
{
    public UpdateSettingRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.");

        RuleFor(x => x.SettingKey)
            .NotEmpty().WithMessage("SettingKey is required.")
            .MaximumLength(100).WithMessage("SettingKey must not exceed 100 characters.");

        RuleFor(x => x.Type)
            .MaximumLength(50).WithMessage("Type must not exceed 50 characters.");

        RuleFor(x => x.SettingValue)
            .MaximumLength(500).WithMessage("SettingValue must not exceed 500 characters.");
    }
}