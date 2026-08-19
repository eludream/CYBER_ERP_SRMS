using CyberErp.Srms.Inf.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CyberErp.Srms.Api.Controllers;

/// <summary>
/// Read-only tenant resource lookups for any authenticated system user.
/// These endpoints deliberately do not apply tenant membership, entitlement,
/// role, or operation-permission checks.
/// </summary>
[ApiController]
[Authorize]
[Route("api/tenant-resources")]
public sealed class TenantResourcesController(SrmsDbContext db) : ControllerBase
{
    [HttpGet("tenants/{tenantId:guid}/sub-systems")]
    public async Task<ActionResult<IReadOnlyList<TenantSubSystemLookupDto>>> GetSubSystems(
        Guid tenantId,
        CancellationToken ct)
    {
        var subSystems = await db.TenantModules.AsNoTracking()
            .Where(x => x.TenantId == tenantId)
            .OrderBy(x => x.Module.DisplayOrder)
            .ThenBy(x => x.Module.Name)
            .Select(x => new TenantSubSystemLookupDto(
                x.Id,
                x.TenantId,
                x.ModuleId,
                x.Module.Code,
                x.Module.Name,
                x.Module.Abbreviation,
                x.Module.Description,
                x.Module.LandingPath,
                x.Module.Icon,
                x.Module.DisplayOrder,
                x.Module.IsActive,
                x.SourceType.ToString(),
                x.Status,
                x.StartDate,
                x.EndDate,
                x.TrialEndDate))
            .ToListAsync(ct);

        return Ok(subSystems);
    }

    [HttpGet("tenants/{tenantId:guid}/sub-systems/{subSystemId:guid}/modules")]
    public async Task<ActionResult<IReadOnlyList<TenantModuleLookupDto>>> GetModules(
        Guid tenantId,
        Guid subSystemId,
        CancellationToken ct)
    {
        var modules = await QueryModules(tenantId, subSystemId).ToListAsync(ct);
        return Ok(modules);
    }

    [HttpGet("tenants/{tenantId:guid}/sub-systems/{subSystemId:guid}/modules/{moduleId:guid}/operations")]
    public async Task<ActionResult<IReadOnlyList<TenantOperationLookupDto>>> GetOperations(
        Guid tenantId,
        Guid subSystemId,
        Guid moduleId,
        CancellationToken ct)
    {
        var operations = await QueryOperations(tenantId, subSystemId)
            .Where(x => x.ModuleId == moduleId)
            .ToListAsync(ct);

        return Ok(operations);
    }

    [HttpGet("tenants/{tenantId:guid}/sub-systems/{subSystemId:guid}/hierarchy")]
    public async Task<ActionResult<TenantResourceHierarchyDto>> GetHierarchy(
        Guid tenantId,
        Guid subSystemId,
        CancellationToken ct)
    {
        var modules = await QueryModules(tenantId, subSystemId).ToListAsync(ct);
        var operations = await QueryOperations(tenantId, subSystemId).ToListAsync(ct);
        var operationsByModule = operations.ToLookup(x => x.ModuleId);

        return Ok(new TenantResourceHierarchyDto(
            tenantId,
            subSystemId,
            modules.Select(module => new TenantModuleWithOperationsLookupDto(
                module.Id,
                module.TenantId,
                module.SubSystemId,
                module.Name,
                module.Filter,
                module.Icon,
                module.DisplayOrder,
                module.IsActive,
                operationsByModule[module.Id].ToList()))
            .ToList()));
    }

    private IQueryable<TenantModuleLookupDto> QueryModules(Guid tenantId, Guid subSystemId) =>
        db.TenantNavigationModules.AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.SubSystemId == subSystemId)
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Name)
            .Select(x => new TenantModuleLookupDto(
                x.Id,
                x.TenantId,
                x.SubSystemId,
                x.Name,
                x.Filter,
                x.Icon,
                x.DisplayOrder,
                x.IsActive));

    private IQueryable<TenantOperationLookupDto> QueryOperations(Guid tenantId, Guid subSystemId) =>
        db.TenantOperations.AsNoTracking()
            .Where(x => x.TenantModule.TenantId == tenantId && x.TenantModule.SubSystemId == subSystemId)
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Name)
            .Select(x => new TenantOperationLookupDto(
                x.Id,
                x.TenantModule.TenantId,
                x.TenantModule.SubSystemId,
                x.TenantModuleId,
                x.Name,
                x.Link,
                x.Filter,
                x.Icon,
                x.DisplayOrder,
                x.IsActive));
}

public sealed record TenantSubSystemLookupDto(
    Guid Id,
    Guid TenantId,
    Guid SubSystemId,
    string Code,
    string Name,
    string Abbreviation,
    string Description,
    string LandingPath,
    string? Icon,
    int DisplayOrder,
    bool IsActive,
    string SourceType,
    bool Status,
    DateTime StartDate,
    DateTime? EndDate,
    DateTime? TrialEndDate);

public sealed record TenantModuleLookupDto(
    Guid Id,
    Guid TenantId,
    Guid SubSystemId,
    string Name,
    string Filter,
    string Icon,
    int DisplayOrder,
    bool IsActive);

public sealed record TenantOperationLookupDto(
    Guid Id,
    Guid TenantId,
    Guid SubSystemId,
    Guid ModuleId,
    string Name,
    string Link,
    string Filter,
    string Icon,
    int DisplayOrder,
    bool IsActive);

public sealed record TenantModuleWithOperationsLookupDto(
    Guid Id,
    Guid TenantId,
    Guid SubSystemId,
    string Name,
    string Filter,
    string Icon,
    int DisplayOrder,
    bool IsActive,
    IReadOnlyList<TenantOperationLookupDto> Operations);

public sealed record TenantResourceHierarchyDto(
    Guid TenantId,
    Guid SubSystemId,
    IReadOnlyList<TenantModuleWithOperationsLookupDto> Modules);
