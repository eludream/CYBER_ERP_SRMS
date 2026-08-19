using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.UserRoles.Update;

public record UpdateUserRoleRequest(
    Guid Id,
    Guid RoleId,
    Guid UserId,
    string? UpdatedBy);

public class UpdateUserRoleRequestValidator : AbstractValidator<UpdateUserRoleRequest>
{
    public UpdateUserRoleRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.");

        RuleFor(x => x.RoleId)
            .NotEmpty().WithMessage("RoleId is required.");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId is required.");
    }
}