using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.RolePermissions.Create;

public record CreateRolePermissionRequest(
    Guid RoleId,
    Guid OperationId,
    bool CanAdd = false,
    bool CanEdit = false,
    bool CanDelete = false,
    bool CanApprove = false,
    bool CanView = true);

public record RolePermissionItem(
    Guid OperationId,
    bool CanAdd = false,
    bool CanEdit = false,
    bool CanDelete = false,
    bool CanApprove = false,
    bool CanView = true);

public record CreateRolePermissionBulkRequest(
    Guid RoleId,
    IEnumerable<RolePermissionItem> Permissions);

public class CreateRolePermissionRequestValidator : AbstractValidator<CreateRolePermissionRequest>
{
    public CreateRolePermissionRequestValidator()
    {
        RuleFor(x => x.RoleId)
            .NotEmpty().WithMessage("Role ID is required.");

        RuleFor(x => x.OperationId)
            .NotEmpty().WithMessage("Operation ID is required.");
    }
}

public class CreateRolePermissionBulkRequestValidator : AbstractValidator<CreateRolePermissionBulkRequest>
{
    public CreateRolePermissionBulkRequestValidator()
    {
        RuleFor(x => x.RoleId)
            .NotEmpty().WithMessage("Role ID is required.");

        RuleFor(x => x.Permissions)
            .NotEmpty().WithMessage("At least one permission is required.");
    }
}