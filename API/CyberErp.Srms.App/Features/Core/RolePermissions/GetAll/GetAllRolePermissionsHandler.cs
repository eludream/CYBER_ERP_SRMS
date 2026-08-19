using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.RolePermissions.DTOs;
using CyberErp.Srms.App.Features.Core.RolePermissions.GetAll;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;

namespace CyberErp.Srms.App.Features.Core.RolePermissions.GetAll;

public class GetAllRolePermissionsHandler(IRepository<RolePermission> repository)
    : IFeatureHandler<GetAllRolePermissionsRequest, PaginatedResponse<RolePermissionDto>>
{
    public async Task<PaginatedResponse<RolePermissionDto>> Handle(GetAllRolePermissionsRequest request, CancellationToken ct = default)
    {
        var query = repository.GetAll();

        var totalCount = await query.CountAsync(ct);

        var skip = int.TryParse(request.Skip ?? "0", out var s) ? s : 0;
        var take = int.TryParse(request.Take ?? "10", out var t) ? t : 10;

        var items = await query
            .Skip(skip)
            .Take(take)
            .Select(x => new RolePermissionDto
            {
                Id = x.Id,
                RoleId = x.RoleId,
                OperationId = x.OperationId,
                CanAdd = x.CanAdd,
                CanEdit = x.CanEdit,
                CanDelete = x.CanDelete,
                CanApprove = x.CanApprove,
                CanView = x.CanView
            })
            .ToListAsync(ct);

        return new PaginatedResponse<RolePermissionDto>
        {
            Data = items,
            TotalRecords = totalCount,
            Total = totalCount,
            PageNumber = skip / take + 1,
            PageSize = take
        };
    }
}