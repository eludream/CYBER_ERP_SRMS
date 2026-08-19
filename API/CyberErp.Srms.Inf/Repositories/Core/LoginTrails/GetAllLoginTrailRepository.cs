using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.App.Features.Core.LoginTrails.DTOs;
using CyberErp.Srms.App.Features.Core.LoginTrails.GetAll;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.Inf.Repositories.Core.LoginTrails;

public class GetAllLoginTrailRepository(
    IRepository<LoginTrail> loginTrailRepository,
    ILogger<GetAllLoginTrailRepository> logger) : IGetAllLoginTrailRepository
{
    private readonly IRepository<LoginTrail> _loginTrailRepository = loginTrailRepository;
    private readonly ILogger<GetAllLoginTrailRepository> _logger = logger;

    public async Task<PaginatedResponse<LoginTrailDto>> GetAllAsync(GetAllRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation("Getting all LoginTrails");

        IQueryable<LoginTrail> query = _loginTrailRepository.GetAll()
            .Include(l => l.User);

        if (!string.IsNullOrEmpty(request.SearchText))
        {
            var searchLower = request.SearchText.ToLower();
            query = query.Where(l => l.IpAddress.ToLower().Contains(searchLower) ||
                                     l.Status.ToLower().Contains(searchLower));
        }

        var total = await query.CountAsync(ct);

        if (!string.IsNullOrEmpty(request.SortCol))
        {
            string sortCol = char.ToUpper(request.SortCol[0]) + request.SortCol.Substring(1);
            bool isDescending = request.Dir?.ToLower() == "desc";

            query = sortCol switch
            {
                "User" => isDescending
                    ? query.OrderByDescending(x => x.User != null ? x.User.FullName : null)
                    : query.OrderBy(x => x.User != null ? x.User.FullName : null),
                _ => isDescending
                    ? query.OrderByDescending(m => EF.Property<object>(m, sortCol))
                    : query.OrderBy(m => EF.Property<object>(m, sortCol))
            };
        }

        int skip = int.TryParse(request.Skip, out var s) ? s : 0;
        int take = int.TryParse(request.Take, out var t) ? t : 10;
        query = query.Skip(skip).Take(take);

        var data = await query.Select(l => new LoginTrailDto
        {
            Id = l.Id,
            UserId = l.UserId,
            Date = l.Date,
            IpAddress = l.IpAddress,
            Status = l.Status
        }).ToListAsync(ct);

        return new PaginatedResponse<LoginTrailDto>
        {
            Total = total,
            Data = data
        };
    }
}