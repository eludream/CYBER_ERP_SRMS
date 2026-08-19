using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.UserRoles.Create;

public record CreateUserRoleRequest(
    Guid RoleId,
    Guid UserId);

public class CreateUserRoleRequestValidator : AbstractValidator<CreateUserRoleRequest>
{
    public CreateUserRoleRequestValidator()
    {
        RuleFor(x => x.RoleId)
            .NotEmpty().WithMessage("Role ID is required.");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required.");
    }
}