using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Users.DTOs;
using CyberErp.Srms.App.Features.Core.Users.GetAll;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;

namespace CyberErp.Srms.App.Features.Core.Users.GetAll;

public class GetAllUsersHandler(IRepository<User> repository)
    : IFeatureHandler<GetAllUsersRequest, PaginatedResponse<UserDto>>
{
    public async Task<PaginatedResponse<UserDto>> Handle(GetAllUsersRequest request, CancellationToken ct = default)
    {
        var query = repository.GetAll();

        var totalCount = await query.CountAsync(ct);

        var skip = int.TryParse(request.Skip ?? "0", out var s) ? s : 0;
        var take = int.TryParse(request.Take ?? "10", out var t) ? t : 10;

        var items = await query
            .Skip(skip)
            .Take(take)
            .Select(x => new UserDto
            {
                Id = x.Id,
                EmployeeId = x.EmployeeId,
                FullName = x.FullName,
                Email = x.Email,
                PhoneNumber = x.PhoneNumber,
                UserName = x.UserName
            })
            .ToListAsync(ct);

        return new PaginatedResponse<UserDto>
        {
            Data = items,
            TotalRecords = totalCount,
            Total = totalCount,
            PageNumber = skip / take + 1,
            PageSize = take
        };
    }
}
