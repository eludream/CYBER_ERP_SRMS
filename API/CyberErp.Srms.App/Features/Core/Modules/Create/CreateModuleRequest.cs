using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.Modules.Create;

public record CreateModuleRequest(string Code, string SubSystem, string Name, string Description,
    string LandingPath, string? Icon, int DisplayOrder = 0, bool IsActive = true, string Abbreviation = "");

public class CreateModuleRequestValidator : AbstractValidator<CreateModuleRequest>
{
    public CreateModuleRequestValidator()
    {
        RuleFor(x => x.Code).NotEmpty().Matches("^[a-z0-9-]+$").MaximumLength(80);
        RuleFor(x => x.SubSystem)
            .NotEmpty().WithMessage("SubSystem is required.")
            .MaximumLength(200).WithMessage("SubSystem must not exceed 200 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");
        RuleFor(x => x.Abbreviation).MaximumLength(50);

        RuleFor(x => x.Icon)
            .MaximumLength(100).WithMessage("Icon must not exceed 100 characters.");
        RuleFor(x => x.Description).NotNull().MaximumLength(500);
        RuleFor(x => x.LandingPath).NotEmpty().Must(x => x.StartsWith('/')).MaximumLength(250);
    }
}
