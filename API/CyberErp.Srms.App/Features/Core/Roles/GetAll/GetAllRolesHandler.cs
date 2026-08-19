using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Roles.DTOs;
using CyberErp.Srms.App.Features.Core.Roles.GetAll;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;

namespace CyberErp.Srms.App.Features.Core.Roles.GetAll;

public class GetAllRolesHandler(IRepository<Role> repository)
    : IFeatureHandler<GetAllRolesRequest, PaginatedResponse<RoleDto>>
{
    public async Task<PaginatedResponse<RoleDto>> Handle(GetAllRolesRequest request, CancellationToken ct = default)
    {
        var query = repository.GetAll();

        var totalCount = await query.CountAsync(ct);

        var skip = int.TryParse(request.Skip ?? "0", out var s) ? s : 0;
        var take = int.TryParse(request.Take ?? "10", out var t) ? t : 10;

        var items = await query
            .Skip(skip)
            .Take(take)
            .Select(x => new RoleDto
            {
                Id = x.Id,
                Name = x.Name,
                Code = x.Code
            })
            .ToListAsync(ct);

        return new PaginatedResponse<RoleDto>
        {
            Data = items,
            TotalRecords = totalCount,
            Total = totalCount,
            PageNumber = skip / take + 1,
            PageSize = take
        };
    }
}