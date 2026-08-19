using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Modules.DTOs;
using CyberErp.Srms.App.Features.Core.Modules.GetOperations;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Hosting;
using CyberErp.Srms.Inf.Common;
using CyberErp.Srms.Inf.Models;

namespace CyberErp.Srms.Inf.Repositories.Core.Modules;

public class GetModuleWithOperationsRepository(
    IRepository<Module> moduleRepository,
    IRepository<UserRole> userRoleRepository,
    IRepository<RolePermission> rolePermissionRepository,
    ITenantService tenantService,
    SrmsDbContext db,
    IHostEnvironment environment,
    ILogger<GetModuleWithOperationsRepository> logger) : IGetModuleWithOperationsRepository
{
    private readonly IRepository<Module> _moduleRepository = moduleRepository;
    private readonly IRepository<UserRole> _userRoleRepository = userRoleRepository;
    private readonly IRepository<RolePermission> _rolePermissionRepository = rolePermissionRepository;
    private readonly ILogger<GetModuleWithOperationsRepository> _logger = logger;

    public async Task<IEnumerable<GetModuleWithOperationResult>> GetAsync(Guid? userId, CancellationToken ct = default)
    {
        _logger.LogInformation("Getting Modules with Operations for user {UserId}", userId);
        var tenantIdText = tenantService.GetCurrentTenantId();
        if (!Guid.TryParse(tenantIdText, out var tenantId))
            throw new UnauthorizedAccessException("A selected tenant context is required.");
        var activeOperationIds = await db.TenantOperations.AsNoTracking()
            .Where(x => x.TenantModule.TenantId == tenantId && x.IsActive)
            .Select(x => x.Id)
            .ToListAsync(ct);
        var assignedModuleIds = await db.TenantModules.AsNoTracking()
            .Where(x => x.TenantId == tenantId)
            .Select(x => x.ModuleId)
            .Distinct()
            .ToListAsync(ct);
        if (environment.IsDevelopment())
        {
            activeOperationIds = await db.Operation.AsNoTracking()
                .Where(x => x.IsActive)
                .Select(x => x.Id)
                .ToListAsync(ct);
            assignedModuleIds = await db.Module.AsNoTracking()
                .Where(x => x.IsActive)
                .Select(x => x.Id)
                .ToListAsync(ct);
        }

        // Get user's role IDs
        var userRoleIds = new List<Guid>();
        if (userId.HasValue)
        {
            userRoleIds = await _userRoleRepository.GetAll()
                .Where(ur => ur.UserId == userId.Value)
                .Select(ur => ur.RoleId)
                .ToListAsync(ct);
        }

        // Get role permissions for the user's roles
        var rolePermissions = await _rolePermissionRepository.GetAll()
            .Where(rp => userRoleIds.Contains(rp.RoleId))
            .ToListAsync(ct);

        // Get subsystems and their normalized module/operation hierarchy.
        var modules = await _moduleRepository.GetAll()
            .Where(m => assignedModuleIds.Contains(m.Id))
            .ToListAsync(ct);
        var platformOperations = await db.Operation.AsNoTracking()
            .Include(x => x.Module)
            .Where(x => assignedModuleIds.Contains(x.Module.SubSystemId) && x.IsActive)
            .ToListAsync(ct);
        var tenantOperations = await db.TenantOperations.AsNoTracking()
            .Include(x => x.TenantModule)
            .Where(x => x.TenantModule.TenantId == tenantId && x.IsActive)
            .ToListAsync(ct);

        var result = modules
            .Select(m => new GetModuleWithOperationResult
            {
                Id = m.Id,
                Name = m.Name ?? string.Empty,
                SubSystem = m.SubSystem ?? string.Empty,
                Operations = (environment.IsDevelopment()
                    ? platformOperations.Where(op => op.Module.SubSystemId == m.Id).Select(op => new { op.Id, ParentId = (Guid?)op.ModuleId, op.Name, op.Link, op.Icon, op.Filter, op.DisplayOrder, op.IsActive })
                    : tenantOperations.Where(op => op.TenantModule.SubSystemId == m.Id).Select(op => new { op.Id, ParentId = (Guid?)op.TenantModuleId, op.Name, op.Link, op.Icon, op.Filter, op.DisplayOrder, op.IsActive }))
                    .OrderBy(op => op.DisplayOrder)
                    .ThenBy(op => op.Name)
                    .Select(op =>
                    {
                        var permission = rolePermissions.FirstOrDefault(rp => rp.OperationId == op.Id);
                        return new OperationRecord
                        {
                            Id = op.Id,
                            ParentOperationId = op.ParentId,
                            Name = op.Name ?? string.Empty,
                            Link = op.Link ?? string.Empty,
                            Icon = op.Icon ?? string.Empty,
                            Filter = op.Filter ?? string.Empty,
                            DisplayOrder = op.DisplayOrder,
                            IsActive = op.IsActive,
                            CanAdd = environment.IsDevelopment() || permission?.CanAdd == true,
                            CanEdit = environment.IsDevelopment() || permission?.CanEdit == true,
                            CanDelete = environment.IsDevelopment() || permission?.CanDelete == true,
                            CanApprove = environment.IsDevelopment() || permission?.CanApprove == true,
                            CanView = environment.IsDevelopment() || permission?.CanView != false

                        };
                    })
                    .ToList()
            })
            .Where(m => m.Operations.Any())
            .ToList();

        return result;
    }
}
