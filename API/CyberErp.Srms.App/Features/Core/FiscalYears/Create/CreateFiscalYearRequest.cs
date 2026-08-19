using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.FiscalYears.Create;

public record CreateFiscalYearRequest(
    string Name,
    string StartDate,
    string EndDate,
    bool IsActive = false);

public class CreateFiscalYearRequestValidator : AbstractValidator<CreateFiscalYearRequest>
{
    public CreateFiscalYearRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Start date is required.");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("End date is required.");
    }
}