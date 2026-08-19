using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.RolePermissions.Create;

public record RolePermissionResult(Guid Id);
public record RolePermissionBulkResult(IEnumerable<Guid> Ids);

public class CreateRolePermissionHandler(
    IRepository<RolePermission> repository,
    IUnitOfWork unitOfWork,
    IValidator<CreateRolePermissionRequest> validator,
    ILogger<CreateRolePermissionHandler> logger)
    : IFeatureHandler<CreateRolePermissionRequest, RolePermissionResult>
{
    public async Task<RolePermissionResult> Handle(CreateRolePermissionRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var rolePermission = RolePermission.Create(
            request.RoleId,
            request.OperationId,
            request.CanAdd,
            request.CanEdit,
            request.CanDelete,
            request.CanApprove,
            request.CanView);

        await repository.AddAsync(rolePermission);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("RolePermission created with Id: {Id}", rolePermission.Id);

        return new RolePermissionResult(rolePermission.Id);
    }
}

public class CreateRolePermissionBulkHandler(
    IRepository<RolePermission> repository,
    IUnitOfWork unitOfWork,
    IValidator<CreateRolePermissionBulkRequest> validator,
    ILogger<CreateRolePermissionBulkHandler> logger)
    : IFeatureHandler<CreateRolePermissionBulkRequest, RolePermissionBulkResult>
{
    public async Task<RolePermissionBulkResult> Handle(CreateRolePermissionBulkRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        // Delete existing permissions for this role
        await repository.Delete(rp => rp.RoleId == request.RoleId);

        var rolePermissions = request.Permissions.Select(p => RolePermission.Create(
            request.RoleId,
            p.OperationId,
            p.CanAdd,
            p.CanEdit,
            p.CanDelete,
            p.CanApprove,
            p.CanView)).ToList();

        repository.AddRange(rolePermissions);
        await unitOfWork.SaveChangesAsync(ct);

        var ids = rolePermissions.Select(rp => rp.Id);
        logger.LogInformation("Created {Count} RolePermissions", ids.Count());

        return new RolePermissionBulkResult(ids);
    }
}
