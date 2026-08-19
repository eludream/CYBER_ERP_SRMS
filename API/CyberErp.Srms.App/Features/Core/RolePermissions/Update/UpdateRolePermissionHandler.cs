using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.RolePermissions.Update;

public record RolePermissionResult(Guid Id);

public class UpdateRolePermissionHandler(
    IRepository<RolePermission> repository,
    IUnitOfWork unitOfWork,
    IValidator<UpdateRolePermissionRequest> validator,
    ILogger<UpdateRolePermissionHandler> logger)
    : IFeatureHandler<UpdateRolePermissionRequest, RolePermissionResult>
{
    public async Task<RolePermissionResult> Handle(UpdateRolePermissionRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var rolePermission = await repository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (rolePermission == null)
        {
            logger.LogWarning("RolePermission with Id: {Id} not found", request.Id);
            throw new NotFoundException(nameof(RolePermission), request.Id.ToString());
        }

        rolePermission.Update(
            request.RoleId,
            request.OperationId,
            request.CanAdd,
            request.CanEdit,
            request.CanDelete,
            request.CanApprove,
            request.CanView);

        repository.UpdateAsync(rolePermission);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("RolePermission updated with Id: {Id}", rolePermission.Id);

        return new RolePermissionResult(rolePermission.Id);
    }
}