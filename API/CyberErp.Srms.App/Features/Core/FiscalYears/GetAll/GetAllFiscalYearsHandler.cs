using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.FiscalYears.DTOs;
using CyberErp.Srms.App.Features.Core.FiscalYears.GetAll;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;

namespace CyberErp.Srms.App.Features.Core.FiscalYears.GetAll;

public class GetAllFiscalYearsHandler(IRepository<FiscalYear> repository)
    : IFeatureHandler<GetAllFiscalYearsRequest, PaginatedResponse<FiscalYearDto>>
{
    public async Task<PaginatedResponse<FiscalYearDto>> Handle(GetAllFiscalYearsRequest request, CancellationToken ct = default)
    {
        var query = repository.GetAll();

        var totalCount = await query.CountAsync(ct);

        var skip = int.TryParse(request.Skip ?? "0", out var s) ? s : 0;
        var take = int.TryParse(request.Take ?? "10", out var t) ? t : 10;

        var items = await query
            .Skip(skip)
            .Take(take)
            .Select(x => new FiscalYearDto
            {
                Id = x.Id,
                Name = x.Name,
                StartDate = x.StartDate.InUtc().ToString(),
                EndDate = x.EndDate.InUtc().ToString(),
                IsActive = x.IsActive
            })
            .ToListAsync(ct);

        return new PaginatedResponse<FiscalYearDto>
        {
            Data = items,
            TotalRecords = totalCount,
            Total = totalCount,
            PageNumber = skip / take + 1,
            PageSize = take
        };
    }
}