using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Operations.DTOs;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Operations.GetAll;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Linq;
using CyberErp.Srms.Inf.Common;
using CyberErp.Srms.Inf.Models;

namespace CyberErp.Srms.Inf.Repositories.Core.Operations;

public class GetAllOperationsRepository(
    ITenantService tenantService,
    SrmsDbContext db,
    ILogger<GetAllOperationsRepository> logger) : IGetAllOperationsRepository
{
    private readonly ILogger<GetAllOperationsRepository> _logger = logger;

    public async Task<PaginatedResponse<OperationDto>> GetAllAsync(GetAllOperationsRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation("Getting all Operations");

        var tenantIdText = tenantService.GetCurrentTenantId();
        if (!Guid.TryParse(tenantIdText, out var tenantId))
            throw new UnauthorizedAccessException("A selected tenant context is required.");
        var tenantModules = await db.TenantNavigationModules.AsNoTracking()
            .Include(x => x.SubSystem)
            .Where(x => x.TenantId == tenantId)
            .ToListAsync(ct);
        var tenantOperations = await db.TenantOperations.AsNoTracking()
            .Include(x => x.TenantModule).ThenInclude(x => x.SubSystem)
            .Where(x => x.TenantModule.TenantId == tenantId)
            .ToListAsync(ct);
        var allItems = tenantModules.Select(x => new OperationDto
            {
                Id = x.Id, ModuleId = x.SubSystemId, ParentOperationId = null,
                Name = x.Name, Module = x.SubSystem.Name, Link = string.Empty,
                Filter = x.Filter, Icon = x.Icon, DisplayOrder = x.DisplayOrder, IsActive = x.IsActive
            })
            .Concat(tenantOperations.Select(x => new OperationDto
            {
                Id = x.Id, ModuleId = x.TenantModule.SubSystemId, ParentOperationId = x.TenantModuleId,
                Name = x.Name, Module = x.TenantModule.SubSystem.Name, Link = x.Link,
                Filter = x.Filter, Icon = x.Icon, DisplayOrder = x.DisplayOrder, IsActive = x.IsActive
            }));
        if (!string.IsNullOrWhiteSpace(request.SearchText))
            allItems = allItems.Where(x => x.Name.Contains(request.SearchText, StringComparison.OrdinalIgnoreCase) || x.Link.Contains(request.SearchText, StringComparison.OrdinalIgnoreCase));
        var orderedItems = allItems.OrderBy(x => x.Module).ThenBy(x => x.ParentOperationId.HasValue).ThenBy(x => x.DisplayOrder).ThenBy(x => x.Name).ToList();
        var totalCount = orderedItems.Count;
        var skip = int.Parse(request.Skip ?? "0");
        var take = int.Parse(request.Take ?? "10");
        var items = orderedItems.Skip(skip).Take(take).ToList();

        return new PaginatedResponse<OperationDto>
        {
            Total = totalCount,
            Data = items
        };
    }
}
