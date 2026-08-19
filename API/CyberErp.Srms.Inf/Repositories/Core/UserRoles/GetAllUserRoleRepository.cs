using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;
using CyberErp.Srms.App.Features.Core.UserRoles.GetAll;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.Inf.Repositories.Core.UserRoles;

public class GetAllUserRoleRepository(
    IRepository<UserRole> userRoleRepository,
    ILogger<GetAllUserRoleRepository> logger) : IGetAllUserRoleRepository
{
    private readonly IRepository<UserRole> _userRoleRepository = userRoleRepository;
    private readonly ILogger<GetAllUserRoleRepository> _logger = logger;

    public async Task<PaginatedResponse<UserRoleResult>> GetAllAsync(GetAllUserRolesRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation("Getting all UserRoles with pagination");

        IQueryable<UserRole> query = _userRoleRepository.GetAll()
            .Include(ur => ur.Role)
            .Include(ur => ur.User);

        if (!string.IsNullOrEmpty(request.SearchText))
        {
            query = query.Where(ur => ur.UserId.ToString().Contains(request.SearchText) ||
                                       ur.RoleId.ToString().Contains(request.SearchText));
        }

        var total = await query.CountAsync(ct);

        if (!string.IsNullOrEmpty(request.SortCol))
        {
            string sortCol = char.ToUpper(request.SortCol[0]) + request.SortCol.Substring(1);
            query = request.Dir?.ToLower() == "desc"
                ? query.OrderByDescending(m => EF.Property<object>(m, sortCol))
                : query.OrderBy(m => EF.Property<object>(m, sortCol));
        }

        int skip = int.TryParse(request.Skip, out var s) ? s : 0;
        int take = int.TryParse(request.Take, out var t) ? t : 10;
        query = query.Skip(skip).Take(take);

        var data = await query.ToListAsync();

        var result = data.Select(ur => new UserRoleResult
        {
            Id = ur.Id,
            RoleId = ur.RoleId,
            UserId = ur.UserId,
            Role = ur.Role?.Name ?? string.Empty,
            User = ur.User?.FullName ?? string.Empty,
            CreatedBy = ur.CreatedBy,
            CreatedAt = ur.CreatedAt.ToString(),
            UpdatedBy = ur.UpdatedBy,
            UpdatedAt = ur.UpdatedAt.HasValue ? ur.UpdatedAt.Value.ToString() : null
        }).ToList();

        return new PaginatedResponse<UserRoleResult>
        {
            Total = total,
            Data = result
        };
    }
}