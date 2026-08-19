using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.RolePermissions.Delete;

public record RolePermissionResult(Guid Id);

public class DeleteRolePermissionHandler(
    IRepository<RolePermission> repository,
    IUnitOfWork unitOfWork,
    ILogger<DeleteRolePermissionHandler> logger)
    : IFeatureHandler<DeleteRolePermissionRequest, RolePermissionResult>
{
    public async Task<RolePermissionResult> Handle(DeleteRolePermissionRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Deleting RolePermission with Id: {Id}", request.Id);

        var rolePermission = await repository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (rolePermission == null)
        {
            logger.LogWarning("RolePermission with Id: {Id} not found", request.Id);
            throw new NotFoundException(nameof(RolePermission), request.Id.ToString());
        }

        repository.Delete(rolePermission);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("RolePermission deleted successfully with Id: {Id}", rolePermission.Id);

        return new RolePermissionResult(rolePermission.Id);
    }
}