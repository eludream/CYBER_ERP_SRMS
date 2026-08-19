using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Tenants.DTOs;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Tenants.GetAll;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace CyberErp.Srms.Inf.Repositories.Core.Tenants;

public class GetAllTenantsRepository(
    IRepository<Tenant> tenantsRepository,
    ILogger<GetAllTenantsRepository> logger) : IGetAllTenantsRepository
{
    private readonly IRepository<Tenant> _tenantsRepository = tenantsRepository;
    private readonly ILogger<GetAllTenantsRepository> _logger = logger;

    public async Task<PaginatedResponse<TenantDto>> GetAllAsync(GetAllTenantsRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation("Getting all Tenants");

        var query = _tenantsRepository.GetAllWithoutTenantFilter();

        if (!string.IsNullOrWhiteSpace(request.SearchText))
        {
            var searchLower = request.SearchText.ToLower();
            query = query.Where(t => t.Name.ToLower().Contains(searchLower) ||
                                     t.Identifier.ToLower().Contains(searchLower) ||
                                     (t.Email != null && t.Email.ToLower().Contains(searchLower)));
        }

        var totalCount = await query.CountAsync(ct);

        query = query.OrderByDescending(x => x.CreatedAt);

        var skip = int.Parse(request.Skip ?? "0");
        var take = int.Parse(request.Take ?? "10");

        var items = await query
            .Skip(skip)
            .Take(take)
            .Select(t => new TenantDto
            {
                Id = t.Id,
                TenantTypeId = t.TenantTypeId,
                TenantTypeName = t.TenantType == null ? null : t.TenantType.Name,
                Name = t.Name,
                Identifier = t.Identifier,
                ConnectionString = t.ConnectionString,
                Theme = t.Theme,
                Address = t.Address,
                PhoneNumber = t.PhoneNumber,
                Email = t.Email,
                IsActive = t.IsActive,
                SubscriptionStartDate = t.SubscriptionStartDate,
                SubscriptionEndDate = t.SubscriptionEndDate,
                CreatedBy = t.CreatedBy,
                CreatedAt = t.CreatedAt.ToString(),
                UpdatedBy = t.UpdatedBy,
                UpdatedAt = t.UpdatedAt.HasValue ? t.UpdatedAt.Value.ToString() : null
            })
            .ToListAsync(ct);

        return new PaginatedResponse<TenantDto>
        {
            Total = totalCount,
            Data = items
        };
    }
}
