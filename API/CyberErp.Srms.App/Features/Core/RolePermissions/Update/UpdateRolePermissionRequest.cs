using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.RolePermissions.Update;

public record UpdateRolePermissionRequest(
    Guid Id,
    Guid RoleId,
    Guid OperationId,
    bool CanAdd = false,
    bool CanEdit = false,
    bool CanDelete = false,
    bool CanApprove = false,
    bool CanView = true);

public class UpdateRolePermissionRequestValidator : AbstractValidator<UpdateRolePermissionRequest>
{
    public UpdateRolePermissionRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.");

        RuleFor(x => x.RoleId)
            .NotEmpty().WithMessage("Role ID is required.");

        RuleFor(x => x.OperationId)
            .NotEmpty().WithMessage("Operation ID is required.");
    }
}