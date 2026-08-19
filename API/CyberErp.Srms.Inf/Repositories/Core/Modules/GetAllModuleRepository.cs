using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Modules.DTOs;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Modules.GetAll;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Hosting;
using System.Linq;
using CyberErp.Srms.Inf.Common;
using CyberErp.Srms.Inf.Models;

namespace CyberErp.Srms.Inf.Repositories.Core.Modules;

public class GetAllModuleRepository(
    IRepository<Module> moduleRepository,
    ITenantService tenantService,
    SrmsDbContext db,
    IHostEnvironment environment,
    ILogger<GetAllModuleRepository> logger) : IGetAllModuleRepository
{
    private readonly IRepository<Module> _moduleRepository = moduleRepository;
    private readonly ILogger<GetAllModuleRepository> _logger = logger;

    public async Task<PaginatedResponse<GetModuleDto>> GetAllAsync(GetAllRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation("Getting all Modules");

        var tenantIdText = tenantService.GetCurrentTenantId();
        if (!Guid.TryParse(tenantIdText, out var tenantId))
            throw new UnauthorizedAccessException("A selected tenant context is required.");
        var assignedModuleIds = db.TenantModules.AsNoTracking()
            .Where(x => x.TenantId == tenantId)
            .Select(x => x.ModuleId);
        var tenantNavigationModules = db.TenantNavigationModules.AsNoTracking()
            .Where(x => x.TenantId == tenantId);
        IQueryable<Module> query = _moduleRepository.GetAll();
        if (!environment.IsDevelopment())
            query = query.Where(m => assignedModuleIds.Contains(m.Id));
        if (!string.IsNullOrWhiteSpace(request.SearchText))
        {
            var searchLower = request.SearchText.ToLower();
            query = query.Where(m => m.Code.ToLower().Contains(searchLower) ||
                                     m.SubSystem.ToLower().Contains(searchLower) ||
                                     m.Abbreviation.ToLower().Contains(searchLower) ||
                                     m.Name.ToLower().Contains(searchLower));
        }

        var totalCount = await query.CountAsync(ct);

        // Core.SubSystem.DisplayOrder is the authoritative ordering everywhere.
        query = query.OrderBy(m => m.DisplayOrder).ThenBy(m => m.Name);

        int skip = int.TryParse(request.Skip, out var s) ? s : 0;
        int take = int.TryParse(request.Take, out var t) ? t : 10;
        query = query.Skip(skip).Take(take);

        var data = await query.Select(m => new GetModuleDto
        {
            Id = m.Id,
            Code = m.Code,
            SubSystem = m.SubSystem,
            Name = m.Name,
            Abbreviation = m.Abbreviation,
            Description = m.Description,
            LandingPath = m.LandingPath,
            Icon = m.Icon,
            DisplayOrder = m.DisplayOrder,
            IsActive = m.IsActive,
            // Tenant navigation is copied when a tenant is provisioned.  Older tenants
            // may not yet have those copies, so display the active platform catalog
            // instead of incorrectly showing zero modules and operations.
            ModuleCount = tenantNavigationModules.Any(n => n.SubSystemId == m.Id)
                ? tenantNavigationModules.Count(n => n.SubSystemId == m.Id && n.IsActive)
                : db.NavigationModules.Count(n => n.SubSystemId == m.Id && n.IsActive),
            OperationCount = tenantNavigationModules.Any(n => n.SubSystemId == m.Id)
                ? db.TenantOperations.Count(o =>
                    o.TenantModule.TenantId == tenantId
                    && o.TenantModule.SubSystemId == m.Id
                    && o.IsActive)
                : db.Operation.Count(o => o.Module.SubSystemId == m.Id && o.IsActive)
        }).ToListAsync(ct);

        return new PaginatedResponse<GetModuleDto>
        {
            Total = totalCount,
            Data = data
        };
    }
}
