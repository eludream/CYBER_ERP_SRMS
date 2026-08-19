using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.Modules.Update;

public record UpdateModuleRequest(Guid Id, string SubSystem, string Name, string Description,
    string LandingPath, string? Icon, int DisplayOrder, bool IsActive, string Abbreviation = "");

public class UpdateModuleRequestValidator : AbstractValidator<UpdateModuleRequest>
{
    public UpdateModuleRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.");

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
