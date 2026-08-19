using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.RolePermissions.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.RolePermissions.GetById;

public class GetRolePermissionByIdHandler(
    IRepository<RolePermission> repository,
    ILogger<GetRolePermissionByIdHandler> logger)
    : IFeatureHandler<GetRolePermissionByIdRequest, RolePermissionDto>
{
    public async Task<RolePermissionDto> Handle(GetRolePermissionByIdRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Getting RolePermission with ID: {Id}", request.Id);

        var rolePermission = await repository.GetAll()
            .FirstOrDefaultAsync(rp => rp.Id == request.Id, ct);

        if (rolePermission == null)
        {
            logger.LogWarning("RolePermission with ID {Id} not found", request.Id);
            throw new NotFoundException(nameof(RolePermission), request.Id.ToString());
        }

        return new RolePermissionDto
        {
            Id = rolePermission.Id,
            RoleId = rolePermission.RoleId,
            OperationId = rolePermission.OperationId,
            CanAdd = rolePermission.CanAdd,
            CanEdit = rolePermission.CanEdit,
            CanDelete = rolePermission.CanDelete,
            CanApprove = rolePermission.CanApprove,
            CanView = rolePermission.CanView
        };
    }
}