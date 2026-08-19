using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.Tenants.Update;

public record UpdateTenantRequest(
    Guid Id,
    string Name,
    string Identifier,
    string? ConnectionString = null,
    string? Theme = null,
    string? Address = null,
    string? PhoneNumber = null,
    string? Email = null,
    bool IsActive = true,
    DateTime? SubscriptionStartDate = null,
    DateTime? SubscriptionEndDate = null,
    Guid? TenantTypeId = null);

public class UpdateTenantRequestValidator : AbstractValidator<UpdateTenantRequest>
{
    public UpdateTenantRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.Identifier)
            .NotEmpty().WithMessage("Identifier is required.")
            .MaximumLength(100).WithMessage("Identifier must not exceed 100 characters.");

        RuleFor(x => x.ConnectionString)
            .MaximumLength(500).WithMessage("ConnectionString must not exceed 500 characters.");

        RuleFor(x => x.Theme)
            .MaximumLength(100).WithMessage("Theme must not exceed 100 characters.");

        RuleFor(x => x.Address)
            .MaximumLength(500).WithMessage("Address must not exceed 500 characters.");

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(50).WithMessage("PhoneNumber must not exceed 50 characters.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Email must be a valid email address.")
            .MaximumLength(200).WithMessage("Email must not exceed 200 characters.");
    }
}
