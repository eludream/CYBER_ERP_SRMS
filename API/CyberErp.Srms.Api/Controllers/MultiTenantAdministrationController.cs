using System.Security.Claims;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.Dom.Entities.Core;
using CyberErp.Srms.Inf.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace CyberErp.Srms.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/platform")]
public sealed class PlatformAdministrationController(IMultiTenantControlPlaneService service, SrmsDbContext db, IAuthentication authentication) : ControllerBase
{
    private const string SystemResourceModuleCode = "001";
    private const string SecurityAdministrationModuleCode = "002";
    private const string SecurityAdministrationModuleAbbreviation = "SAMS";
    private const string SystemSettingsModuleCode = "003";
    private const string SystemSettingsModuleAbbreviation = "SSMS";
    private static DateTime? AsUtc(DateTime? value) => value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : null;
    private static bool IsSecurityAdministrationModule(Module module) =>
        module.Code.Equals(SecurityAdministrationModuleCode, StringComparison.OrdinalIgnoreCase)
        || module.Abbreviation.Equals(SecurityAdministrationModuleAbbreviation, StringComparison.OrdinalIgnoreCase);
    private static bool IsRequiredTenantModule(Module module) =>
        IsSecurityAdministrationModule(module)
        || module.Code.Equals(SystemSettingsModuleCode, StringComparison.OrdinalIgnoreCase)
        || module.Abbreviation.Equals(SystemSettingsModuleAbbreviation, StringComparison.OrdinalIgnoreCase);
    private Guid UserId => Guid.TryParse(User.FindFirstValue("UserId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : throw new UnauthorizedAccessException();
    private async Task Demand(CancellationToken ct) => await service.EnsurePlatformAdministratorAsync(UserId, ct);

    [HttpGet("users")]
    public async Task<IActionResult> Users(CancellationToken ct)
    {
        await Demand(ct);
        var users = await db.User.AsNoTracking()
            .OrderBy(x => x.FullName)
            .Select(x => new
        {
            x.Id, x.EmployeeId, x.FullName, x.Email, PhoneNumber = x.PhoneNumber ?? string.Empty, x.UserName, x.AccountStatus,
            x.TwoFactorEnabled, x.LockoutEndUtc,
            IsPlatformAdministrator = db.UserRole.Any(userRole =>
                userRole.UserId == x.Id &&
                (userRole.Role.Code == "ADMINISTRATOR" || userRole.Role.Name == "Administrator")),
            x.CreatedAt,
            ProfilePictureUrl = x.ProfilePicture == null ? null : $"/api/v1.0/User/{x.Id}/profile-picture",
            TenantCount = db.TenantUsers.Count(m => m.UserId == x.Id),
            RoleIds = db.UserRole.Where(role => role.UserId == x.Id).Select(role => role.RoleId).ToArray()
        }).ToListAsync(ct);
        var employees = await GetEmployeeDetails(ct);
        return Ok(users.Select(x => new
        {
            x.Id, x.EmployeeId,
            EmployeeFullName = x.EmployeeId.HasValue && employees.TryGetValue(x.EmployeeId.Value, out var employee) ? employee.FullName : null,
            EmployeeNumber = x.EmployeeId.HasValue && employees.TryGetValue(x.EmployeeId.Value, out employee) ? employee.EmployeeNumber : null,
            x.FullName, x.Email, PhoneNumber = x.PhoneNumber ?? string.Empty, x.UserName, x.AccountStatus, x.TwoFactorEnabled, LockoutEndUtc = AsUtc(x.LockoutEndUtc),
            x.IsPlatformAdministrator, x.CreatedAt, x.ProfilePictureUrl, x.TenantCount, x.RoleIds
        }));
    }

    private async Task<Dictionary<Guid, EmployeeDisplay>> GetEmployeeDetails(CancellationToken ct)
    {
        var results = new Dictionary<Guid, EmployeeDisplay>();
        var connection = db.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;
        if (shouldClose) await connection.OpenAsync(ct);
        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = """
                SELECT e.Id, e.EmployeeNumber,
                       LTRIM(RTRIM(CONCAT(p.FirstName, ' ', NULLIF(p.FatherName, ''), ' ', p.GrandFatherName)))
                FROM [Hrms].[Employee] e
                INNER JOIN [Core].[Person] p ON p.Id = e.PersonId;
                """;
            await using var reader = await command.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
                results[reader.GetGuid(0)] = new EmployeeDisplay(reader.GetString(1), reader.GetString(2));
        }
        finally
        {
            if (shouldClose) await connection.CloseAsync();
        }
        return results;
    }

    private sealed record EmployeeDisplay(string EmployeeNumber, string FullName);

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser(PlatformUserWrite dto, CancellationToken ct)
    {
        await Demand(ct);
        var normalizedEmail = dto.Email.Trim().ToUpperInvariant();
        var normalizedUserName = dto.UserName.Trim().ToUpperInvariant();
        if (await db.User.AnyAsync(x => x.NormalizedEmail == normalizedEmail || x.NormalizedUserName == normalizedUserName, ct))
            return Conflict(new { message = "A user with this email address or username already exists." });
        var settings = await db.PlatformSystemSettings.AsNoTracking().SingleAsync(ct);
        var passwordErrors = PlatformSecurityPolicy.ValidatePassword(dto.Password, settings);
        if (passwordErrors.Count > 0)
            return BadRequest(new { message = string.Join(" ", passwordErrors), errors = passwordErrors });
        var roleIds = dto.RoleIds?.Distinct().ToArray() ?? [];
        var validRoleIds = await db.StandardRoleTemplates.AsNoTracking()
            .Where(role => role.IsPlatformRole && role.IsActive && roleIds.Contains(role.Id))
            .Select(role => role.Id)
            .ToArrayAsync(ct);
        if (validRoleIds.Length != roleIds.Length)
            return BadRequest(new { message = "One or more roles are inactive or are not platform roles." });
        var user = CyberErp.Srms.Dom.Entities.Core.User.Create(dto.FullName.Trim(), dto.Email.Trim(), dto.PhoneNumber?.Trim(), dto.UserName.Trim(), authentication.EncryptPassword(dto.Password!), dto.EmployeeId);
        var isPlatformAdministrator = await db.StandardRoleTemplates.AsNoTracking()
            .AnyAsync(role => validRoleIds.Contains(role.Id) &&
                (role.Code == "ADMINISTRATOR" || role.Name == "Administrator"), ct);
        user.SetPlatformAdministrator(isPlatformAdministrator);
        user.UpdateSecurity(dto.AccountStatus, dto.TwoFactorEnabled);
        db.User.Add(user);
        foreach (var roleId in validRoleIds)
            db.UserRole.Add(UserRole.Create(roleId, user.Id));
        await db.SaveChangesAsync(ct);
        return Ok(new { user.Id });
    }

    [HttpPut("users/{id:guid}")]
    public async Task<IActionResult> UpdateUser(Guid id, PlatformUserWrite dto, CancellationToken ct)
    {
        await Demand(ct);
        var user = await db.User.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (user is null) return NotFound();
        var normalizedEmail = dto.Email.Trim().ToUpperInvariant();
        var normalizedUserName = dto.UserName.Trim().ToUpperInvariant();
        if (await db.User.AnyAsync(x => x.Id != id && (x.NormalizedEmail == normalizedEmail || x.NormalizedUserName == normalizedUserName), ct))
            return Conflict(new { message = "A user with this email address or username already exists." });
        var roleIds = dto.RoleIds?.Distinct().ToArray() ?? [];
        var validRoleIds = await db.StandardRoleTemplates.AsNoTracking()
            .Where(role => role.IsPlatformRole && role.IsActive && roleIds.Contains(role.Id))
            .Select(role => role.Id)
            .ToArrayAsync(ct);
        if (validRoleIds.Length != roleIds.Length)
            return BadRequest(new { message = "One or more roles are inactive or are not platform roles." });
        user.Update(dto.FullName.Trim(), dto.Email.Trim(), dto.PhoneNumber?.Trim(), dto.UserName.Trim(), dto.EmployeeId);
        var isPlatformAdministrator = await db.StandardRoleTemplates.AsNoTracking()
            .AnyAsync(role => validRoleIds.Contains(role.Id) &&
                (role.Code == "ADMINISTRATOR" || role.Name == "Administrator"), ct);
        user.SetPlatformAdministrator(isPlatformAdministrator);
        user.UpdateSecurity(dto.AccountStatus, dto.TwoFactorEnabled);
        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            var settings = await db.PlatformSystemSettings.AsNoTracking().SingleAsync(ct);
            var passwordErrors = PlatformSecurityPolicy.ValidatePassword(dto.Password, settings);
            if (passwordErrors.Count > 0)
                return BadRequest(new { message = string.Join(" ", passwordErrors), errors = passwordErrors });
            user.ChangePassword(authentication.EncryptPassword(dto.Password));
        }
        var existingRoles = await db.UserRole.Where(role => role.UserId == id).ToListAsync(ct);
        db.UserRole.RemoveRange(existingRoles.Where(role => !validRoleIds.Contains(role.RoleId)));
        foreach (var roleId in validRoleIds.Where(roleId => existingRoles.All(role => role.RoleId != roleId)))
            db.UserRole.Add(UserRole.Create(roleId, id));
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken ct)
    {
        await Demand(ct);
        if (id == UserId)
            return Conflict(new { message = "You cannot delete the account you are currently signed in with." });
        if (await db.UserRole.AnyAsync(x => x.UserId == id &&
                (x.Role.Code == "ADMINISTRATOR" || x.Role.Name == "Administrator"), ct))
            return Conflict(new { message = "Users assigned the Administrator role are system-managed and cannot be deleted." });
        if (await db.TenantUsers.AnyAsync(x => x.UserId == id, ct))
            return Conflict(new { message = "This user is associated with a tenant. Remove that association before deleting the user." });
        if (await db.Approver.AnyAsync(x => x.ApproverId == id, ct) ||
            await db.Notification.AnyAsync(x => x.ApproverId == id, ct) ||
            await db.VoucherTransaction.AnyAsync(x => x.ApproverId == id, ct))
            return Conflict(new { message = "This user is referenced by approval or transaction history and cannot be deleted." });

        var user = await db.User.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (user is null) return NotFound();
        db.User.Remove(user);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("system-settings")]
    public async Task<IActionResult> SystemSettings(CancellationToken ct)
    {
        await Demand(ct);
        return Ok(await db.PlatformSystemSettings.AsNoTracking().SingleAsync(ct));
    }

    [HttpPut("system-settings")]
    public async Task<IActionResult> SaveSystemSettings(PlatformSystemSettings dto, CancellationToken ct)
    {
        await Demand(ct);
        if (dto.MinimumPasswordLength is < 6 or > 24 || dto.SessionTimeoutMinutes is < 5 or > 120 ||
            dto.MaxLoginAttempts is < 1 or > 20 || dto.LockoutDurationMinutes is < 0 or > 1440 ||
            dto.SmtpPort is < 1 or > 65535 || dto.BackupRetentionDays < 1)
            return BadRequest(new { message = "One or more platform setting values are outside the supported range." });
        var entity = await db.PlatformSystemSettings.SingleOrDefaultAsync(ct);
        if (entity is null)
        {
            dto.Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id;
            dto.CreatedAt = dto.UpdatedAt = DateTime.UtcNow;
            db.PlatformSystemSettings.Add(dto);
            entity = dto;
        }
        else
        {
            dto.Id = entity.Id; dto.CreatedAt = entity.CreatedAt; dto.UpdatedAt = DateTime.UtcNow;
            db.Entry(entity).CurrentValues.SetValues(dto);
        }
        await db.SaveChangesAsync(ct);
        return Ok(entity);
    }

    [HttpGet("modules")] public async Task<IActionResult> Modules(CancellationToken ct) { await Demand(ct); return Ok(await service.GetModulesAsync(ct)); }
    [HttpPost("modules")] public async Task<IActionResult> CreateModule(PlatformModuleWriteDto dto, CancellationToken ct) { await Demand(ct); return Ok(await service.SaveModuleAsync(null, dto, ct)); }
    [HttpPut("modules/{id:guid}")] public async Task<IActionResult> UpdateModule(Guid id, PlatformModuleWriteDto dto, CancellationToken ct) { await Demand(ct); return Ok(await service.SaveModuleAsync(id, dto, ct)); }
    [HttpDelete("modules/{id:guid}")] public async Task<IActionResult> DeleteModule(Guid id,CancellationToken ct){await Demand(ct);var entity=await db.Module.SingleOrDefaultAsync(x=>x.Id==id,ct);if(entity is null)return NotFound();if(entity.Code==SystemResourceModuleCode)return Conflict(new{message="System Resource is protected and cannot be deleted."});if(await db.Operation.AnyAsync(x=>x.ModuleId==id,ct)||await db.TenantModules.AnyAsync(x=>x.ModuleId==id,ct)||await db.SubscriptionPlanModules.AnyAsync(x=>x.ModuleId==id,ct))return Conflict(new{message="Module is referenced by operations, plans, or tenant modules. Deactivate it instead."});db.Module.Remove(entity);await db.SaveChangesAsync(ct);return NoContent();}
    [HttpGet("modules/{moduleId:guid}/operations")] public async Task<IActionResult> Operations(Guid moduleId, CancellationToken ct) { await Demand(ct); return Ok(await service.GetOperationsAsync(moduleId, ct)); }
    [HttpPost("modules/{moduleId:guid}/operations")] public async Task<IActionResult> CreateOperation(Guid moduleId, PlatformOperationWriteDto dto, CancellationToken ct) { await Demand(ct); return Ok(await service.SaveOperationAsync(moduleId, null, dto, ct)); }
    [HttpPut("modules/{moduleId:guid}/operations/{id:guid}")] public async Task<IActionResult> UpdateOperation(Guid moduleId, Guid id, PlatformOperationWriteDto dto, CancellationToken ct) { await Demand(ct); return Ok(await service.SaveOperationAsync(moduleId, id, dto, ct)); }
    [HttpDelete("modules/{moduleId:guid}/operations/{id:guid}")]
    public async Task<IActionResult> DeleteOperation(Guid moduleId, Guid id, CancellationToken ct)
    {
        await Demand(ct);
        if (await db.Module.AnyAsync(x => x.Id == moduleId && x.Code == SystemResourceModuleCode, ct))
            return BadRequest(new { message = "System Resource does not support operation menus." });
        var operation = await db.Operation.SingleOrDefaultAsync(x => x.Id == id && x.Module.SubSystemId == moduleId, ct);
        if (operation is null)
        {
            var navigationModule = await db.NavigationModules.SingleOrDefaultAsync(x => x.Id == id && x.SubSystemId == moduleId, ct);
            if (navigationModule is null) return NotFound();
            var navigationChildNames = await db.Operation.Where(x => x.ModuleId == id).Select(x => x.Name).ToListAsync(ct);
            if (navigationChildNames.Count > 0)
                return Conflict(new { message = $"Delete the child operation{(navigationChildNames.Count == 1 ? "" : "s")} first: {string.Join(", ", navigationChildNames)}." });
            db.NavigationModules.Remove(navigationModule);
            await db.SaveChangesAsync(ct);
            return NoContent();
        }
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await db.TenantRolePermissions.Where(x => x.TenantOperation.Id == id).ExecuteDeleteAsync(ct);
        await db.TenantOperations.Where(x => x.Id == id).ExecuteDeleteAsync(ct);
        await db.Operation.Where(x => x.Id == id).ExecuteDeleteAsync(ct);
        await transaction.CommitAsync(ct);
        return NoContent();
    }

    [HttpGet("organizations")] public async Task<IActionResult> Organizations(CancellationToken ct) { await Demand(ct); return Ok(await service.GetOrganizationsAsync(ct)); }
    [HttpPost("organizations")] public async Task<IActionResult> CreateOrganization(OrganizationWriteDto dto, CancellationToken ct) { await Demand(ct); if(await db.Organizations.AnyAsync(ct)) return Conflict(new{message="Only one organization is allowed. Maintain the existing organization instead."}); return Ok(await service.SaveOrganizationAsync(null, dto, ct)); }
    [HttpPut("organizations/{id:guid}")] public async Task<IActionResult> UpdateOrganization(Guid id, OrganizationWriteDto dto, CancellationToken ct) { await Demand(ct); return Ok(await service.SaveOrganizationAsync(id, dto, ct)); }
    [HttpPost("organizations/{id:guid}/logo")]
    [RequestSizeLimit(2 * 1024 * 1024)]
    public async Task<IActionResult> UploadOrganizationLogo(Guid id, IFormFile file, CancellationToken ct)
    {
        await Demand(ct);
        var organization = await db.Organizations.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (organization is null) return NotFound();
        if (file is null || file.Length == 0) return BadRequest(new { message = "Choose an image file to upload." });
        if (file.Length > 2 * 1024 * 1024) return BadRequest(new { message = "Organization logos must be 2 MB or smaller." });
        var allowedTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "image/jpeg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType)) return BadRequest(new { message = "Only JPG, PNG, and WebP images are supported." });
        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream, ct);
        organization.SetLogo(stream.ToArray(), file.ContentType);
        await db.SaveChangesAsync(ct);
        return Ok(new { logoUrl = $"/api/platform/organizations/{id}/logo?v={DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}" });
    }
    [AllowAnonymous]
    [HttpGet("organizations/{id:guid}/logo")]
    public async Task<IActionResult> OrganizationLogo(Guid id, CancellationToken ct)
    {
        var logo = await db.Organizations.AsNoTracking().Where(x => x.Id == id).Select(x => new { x.Logo, x.LogoContentType }).SingleOrDefaultAsync(ct);
        if (logo?.Logo is null) return NotFound();
        return File(logo.Logo, logo.LogoContentType ?? "image/png");
    }
    [HttpDelete("organizations/{id:guid}/logo")]
    public async Task<IActionResult> DeleteOrganizationLogo(Guid id, CancellationToken ct)
    {
        await Demand(ct);
        var organization = await db.Organizations.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (organization is null) return NotFound();
        organization.ClearLogo();
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
    [HttpDelete("organizations/{id:guid}")] public async Task<IActionResult> DeleteOrganization(Guid id,CancellationToken ct){await Demand(ct);if(await db.Tenant.AnyAsync(x=>x.OrganizationId==id,ct)||await db.OrganizationSubscriptions.AnyAsync(x=>x.OrganizationId==id,ct))return Conflict(new{message="Organization has tenants or subscriptions. Deactivate it instead."});var entity=await db.Organizations.SingleOrDefaultAsync(x=>x.Id==id,ct);if(entity is null)return NotFound();db.Organizations.Remove(entity);await db.SaveChangesAsync(ct);return NoContent();}
    [HttpGet("organizations/{organizationId:guid}/tenants")] public async Task<IActionResult> Tenants(Guid organizationId, CancellationToken ct) { await Demand(ct); return Ok(await db.Tenant.AsNoTracking().Where(x => x.OrganizationId == organizationId).Select(x => new TenantSummaryDto(x.Id, x.OrganizationId, x.Identifier, x.Name, x.IsActive, x.TenantTypeId, x.TenantType == null ? null : x.TenantType.Name)).ToListAsync(ct)); }
    [HttpGet("organizations/{organizationId:guid}/tenants/{id:guid}/entitlements")] public async Task<IActionResult> TenantEntitlements(Guid organizationId,Guid id,CancellationToken ct){await Demand(ct);if(!await db.Tenant.AnyAsync(x=>x.Id==id&&x.OrganizationId==organizationId,ct))return NotFound();return Ok(await db.TenantModules.AsNoTracking().Where(x=>x.TenantId==id&&x.Module.Code!=SystemResourceModuleCode).OrderBy(x=>x.Module.DisplayOrder).ThenBy(x=>x.Module.Name).Select(x=>new EntitlementDto(x.Id,x.ModuleId,x.Module.Code,x.Module.Name,x.Module.Description,x.StartDate,x.EndDate,x.Status,true)).ToListAsync(ct));}
    [HttpPost("organizations/{organizationId:guid}/tenants")] public async Task<IActionResult> CreateTenant(Guid organizationId, PlatformTenantWrite dto, CancellationToken ct) { await Demand(ct); if (organizationId != dto.OrganizationId) return BadRequest(new{message="Organization mismatch."});if(string.IsNullOrWhiteSpace(dto.Identifier)||string.IsNullOrWhiteSpace(dto.Name))return BadRequest(new{message="Tenant identifier and name are required."});if(dto.TenantTypeId.HasValue&&!await db.LookupCategoryItems.AnyAsync(x=>x.Id==dto.TenantTypeId,ct))return BadRequest(new{message="Tenant type does not exist."});if(await db.Tenant.AnyAsync(x=>x.OrganizationId==organizationId&&x.Identifier==dto.Identifier.Trim(),ct))return Conflict(new{message="A tenant with this identifier already exists."});var mandatoryModuleIds=await GetMandatoryTenantModuleIds(ct);if(mandatoryModuleIds.Count!=2)return Problem("The mandatory SAMS (002) and SSMS (003) subsystems must be configured and active.");var moduleIds=(dto.ModuleIds??[]).Concat(mandatoryModuleIds).Distinct().ToList();if(await db.Module.CountAsync(x=>moduleIds.Contains(x.Id)&&x.IsActive&&x.Code!=SystemResourceModuleCode,ct)!=moduleIds.Count)return BadRequest(new{message="One or more selected modules are invalid, inactive, or unavailable for tenant association."});var result=await service.SaveTenantAsync(null,new TenantWriteDto(dto.OrganizationId,dto.Identifier.Trim(),dto.Name.Trim(),IsActive:dto.IsActive,TenantTypeId:dto.TenantTypeId),ct);foreach(var moduleId in moduleIds)db.TenantModules.Add(TenantModule.Create(organizationId,result.Id,moduleId,DateTime.UtcNow,null,EntitlementSourceType.BasePlan));await CopyModuleOperations(result.Id,moduleIds,ct);await db.SaveChangesAsync(ct);return Ok(result); }
    [HttpPut("organizations/{organizationId:guid}/tenants/{id:guid}")]
    public async Task<IActionResult> UpdateTenant(Guid organizationId, Guid id, PlatformTenantWrite dto, CancellationToken ct)
    {
        await Demand(ct);
        if (organizationId != dto.OrganizationId) return BadRequest("Organization mismatch.");
        var existing = await db.TenantModules.Where(x => x.TenantId == id).ToListAsync(ct);
        var existingModuleIds = existing.Select(x => x.ModuleId).ToHashSet();
        var mandatoryModuleIds = await GetMandatoryTenantModuleIds(ct);
        if (mandatoryModuleIds.Count != 2) return Problem("The mandatory SAMS (002) and SSMS (003) subsystems must be configured and active.");
        var requested = (dto.ModuleIds ?? []).Concat(mandatoryModuleIds).ToHashSet();
        var newModuleIds = requested.Where(x => !existingModuleIds.Contains(x)).ToList();
        if (await db.Module.CountAsync(x => newModuleIds.Contains(x.Id) && x.IsActive && x.Code != SystemResourceModuleCode, ct) != newModuleIds.Count)
            return BadRequest("One or more newly selected modules are invalid, inactive, or unavailable for tenant association.");

        if(dto.TenantTypeId.HasValue&&!await db.LookupCategoryItems.AnyAsync(x=>x.Id==dto.TenantTypeId,ct))return BadRequest(new{message="Tenant type does not exist."});
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var result = await service.SaveTenantAsync(id, new TenantWriteDto(dto.OrganizationId, dto.Identifier, dto.Name, IsActive: dto.IsActive, TenantTypeId: dto.TenantTypeId), ct);
        var removedModuleIds = existingModuleIds.Where(x => !requested.Contains(x)).ToHashSet();
        await RemoveUnassignedTenantSubSystems(id, removedModuleIds, existing, ct);
        foreach (var moduleId in newModuleIds)
            db.TenantModules.Add(TenantModule.Create(organizationId, id, moduleId, DateTime.UtcNow, null, EntitlementSourceType.BasePlan));
        await CopyModuleOperations(id, newModuleIds, ct);

        var adminRole = await db.TenantRoles.Include(x => x.Permissions).SingleOrDefaultAsync(x => x.TenantId == id && x.Code == "TENANT_ADMINISTRATOR", ct);
        if (adminRole is not null)
        {
            var deletedOperationIds = db.ChangeTracker.Entries<TenantOperation>()
                .Where(entry => entry.State == EntityState.Deleted)
                .Select(entry => entry.Entity.Id)
                .ToHashSet();
            var granted = adminRole.Permissions.Select(x => x.TenantOperationId).Where(operationId => !deletedOperationIds.Contains(operationId)).ToHashSet();
            var tenantOperationIds = await db.TenantOperations.Where(x => x.TenantModule.TenantId == id && requested.Contains(x.TenantModule.SubSystemId) && !granted.Contains(x.Id)).Select(x => x.Id).ToListAsync(ct);
            tenantOperationIds.AddRange(db.TenantOperations.Local.Where(x => db.Entry(x).State != EntityState.Deleted && db.TenantNavigationModules.Local.Any(module => module.Id == x.TenantModuleId && module.TenantId == id && requested.Contains(module.SubSystemId)) && !granted.Contains(x.Id)).Select(x => x.Id));
            foreach (var tenantOperationId in tenantOperationIds.Distinct().Where(operationId => !deletedOperationIds.Contains(operationId)))
                db.TenantRolePermissions.Add(TenantRolePermission.Create(adminRole.Id, tenantOperationId, true, true, true, true, true));
        }
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return Ok(result);
    }

    private async Task RemoveUnassignedTenantSubSystems(Guid tenantId, HashSet<Guid> removedSubSystemIds, IReadOnlyCollection<TenantModule> existingEntitlements, CancellationToken ct)
    {
        if (removedSubSystemIds.Count == 0) return;

        var removedOperations = await db.TenantOperations
            .Where(x => x.TenantModule.TenantId == tenantId && removedSubSystemIds.Contains(x.TenantModule.SubSystemId))
            .ToListAsync(ct);
        var removedOperationIds = removedOperations.Select(x => x.Id).ToList();
        if (removedOperationIds.Count > 0)
        {
            db.TenantRolePermissions.RemoveRange(
                await db.TenantRolePermissions.Where(x => removedOperationIds.Contains(x.TenantOperationId)).ToListAsync(ct));
        }
        db.TenantOperations.RemoveRange(removedOperations);
        db.TenantNavigationModules.RemoveRange(
            await db.TenantNavigationModules.Where(x => x.TenantId == tenantId && removedSubSystemIds.Contains(x.SubSystemId)).ToListAsync(ct));
        db.TenantModules.RemoveRange(existingEntitlements.Where(x => removedSubSystemIds.Contains(x.ModuleId)));
    }

    private async Task CopyModuleOperations(Guid tenantId, IReadOnlyCollection<Guid> moduleIds, CancellationToken ct)
    {
        if (moduleIds.Count == 0) return;
        var platformModules = await db.NavigationModules.AsNoTracking()
            .Where(x => moduleIds.Contains(x.SubSystemId))
            .ToListAsync(ct);
        var tenantModules = await db.TenantNavigationModules.Where(x => x.TenantId == tenantId && moduleIds.Contains(x.SubSystemId)).ToListAsync(ct);
        var moduleMap = new Dictionary<Guid, Guid>();
        foreach (var source in platformModules)
        {
            var copy = tenantModules.FirstOrDefault(candidate => candidate.SubSystemId == source.SubSystemId && candidate.Name == source.Name);
            if (copy is null)
            {
                copy = TenantNavigationModule.Copy(tenantId, source);
                db.TenantNavigationModules.Add(copy);
                tenantModules.Add(copy);
            }
            moduleMap[source.Id] = copy.Id;
        }
        var operations = await db.Operation.AsNoTracking()
            .Where(x => moduleIds.Contains(x.Module.SubSystemId))
            .ToListAsync(ct);
        var existingKeys = (await db.TenantOperations
                .Where(x => x.TenantModule.TenantId == tenantId)
                .Select(x => new { x.TenantModuleId, x.Name, x.Link })
                .ToListAsync(ct))
            .Select(x => (x.TenantModuleId, x.Name, x.Link))
            .ToHashSet();
        foreach (var local in db.TenantOperations.Local)
            existingKeys.Add((local.TenantModuleId, local.Name, local.Link));
        foreach (var operation in operations)
        {
            if (!moduleMap.TryGetValue(operation.ModuleId, out var tenantModuleId)) continue;
            if (!existingKeys.Add((tenantModuleId, operation.Name, operation.Link))) continue;
            db.TenantOperations.Add(TenantOperation.Copy(tenantId, operation, tenantModuleId));
        }
    }

    private async Task<List<Guid>> GetMandatoryTenantModuleIds(CancellationToken ct) => await db.Module
        .Where(x => x.IsActive &&
            (x.Code == SecurityAdministrationModuleCode || x.Abbreviation == SecurityAdministrationModuleAbbreviation ||
             x.Code == SystemSettingsModuleCode || x.Abbreviation == SystemSettingsModuleAbbreviation))
        .Select(x => x.Id)
        .Distinct()
        .ToListAsync(ct);
    [HttpDelete("organizations/{organizationId:guid}/tenants/{id:guid}")]
    public async Task<IActionResult> DeleteTenant(Guid organizationId, Guid id, CancellationToken ct)
    {
        await Demand(ct);
        var tenant = await db.Tenant.SingleOrDefaultAsync(x => x.Id == id && x.OrganizationId == organizationId, ct);
        if (tenant is null) return NotFound();
        var tenantModules = await db.TenantModules.Include(x => x.Module).Where(x => x.TenantId == id).ToListAsync(ct);
        if (tenantModules.Any(x => !IsRequiredTenantModule(x.Module)))
            return Conflict(new { message = "Remove all optional subsystem assignments before deleting this tenant." });

        // Roles and memberships are provisioned as part of tenant setup. They belong
        // to the tenant and should not prevent an otherwise empty tenant being removed.
        db.TenantUserRoles.RemoveRange(await db.TenantUserRoles.Where(x => x.TenantUser.TenantId == id).ToListAsync(ct));
        db.TenantRolePermissions.RemoveRange(await db.TenantRolePermissions.Where(x => x.TenantRole.TenantId == id).ToListAsync(ct));
        db.TenantRoles.RemoveRange(await db.TenantRoles.Where(x => x.TenantId == id).ToListAsync(ct));
        db.TenantUsers.RemoveRange(await db.TenantUsers.Where(x => x.TenantId == id).ToListAsync(ct));
        db.TenantOperations.RemoveRange(await db.TenantOperations.Where(x => x.TenantModule.TenantId == id).ToListAsync(ct));
        // Core.TenantModule contains the tenant-owned navigation-module copies.
        // The live FK is restrictive, so remove them explicitly after their operations.
        db.TenantNavigationModules.RemoveRange(await db.TenantNavigationModules.Where(x => x.TenantId == id).ToListAsync(ct));
        db.TenantModules.RemoveRange(tenantModules);
        db.Tenant.Remove(tenant);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
    [HttpPost("organization-onboarding")] public async Task<IActionResult> OnboardOrganization(OrganizationOnboardingDto dto, CancellationToken ct) { await Demand(ct); return Ok(await service.OnboardOrganizationAsync(dto, ct)); }
    [HttpPost("tenant-onboarding")] public async Task<IActionResult> OnboardTenant(TenantOnboardingDto dto, CancellationToken ct) { await Demand(ct); return Ok(await service.OnboardTenantAsync(dto, ct)); }
    [HttpPost("organization-subscriptions")] public async Task<IActionResult> Subscription(SubscriptionWriteDto dto, CancellationToken ct) { await Demand(ct); await service.CreateSubscriptionAsync(dto, ct); return NoContent(); }
    [HttpGet("organization-subscriptions")] public async Task<IActionResult> Subscriptions(CancellationToken ct) { await Demand(ct); return Ok(await db.OrganizationSubscriptions.AsNoTracking().Select(x => new { x.Id, x.OrganizationId, PlanId=x.SubscriptionPlanId, Status=x.Status.ToString(), x.Currency, x.StartDate, x.EndDate, x.AutoRenew }).ToListAsync(ct)); }

    [HttpGet("subscription-plans")] public async Task<IActionResult> Plans(CancellationToken ct) { await Demand(ct); var plans=await db.SubscriptionPlan.AsNoTracking().Select(x=>new{x.Id,x.Code,x.Name,x.Description,x.Price,x.BillingCycle,x.MaxUsers,x.MaxStorageGB,x.TrialDays,x.IsActive}).ToListAsync(ct); var planIds=plans.Select(x=>x.Id).ToList(); var modules=await db.SubscriptionPlanModules.AsNoTracking().Where(x=>planIds.Contains(x.SubscriptionPlanId)).Select(x=>new{x.SubscriptionPlanId,x.ModuleId}).ToListAsync(ct); return Ok(plans.Select(x=>new{x.Id,x.Code,x.Name,x.Description,x.Price,x.BillingCycle,x.MaxUsers,x.MaxStorageGB,x.TrialDays,x.IsActive,ModuleIds=modules.Where(m=>m.SubscriptionPlanId==x.Id).Select(m=>m.ModuleId).ToList()}).ToList()); }
    [HttpPost("subscription-plans")] public async Task<IActionResult> CreatePlan(PlanWrite dto, CancellationToken ct) { await Demand(ct); var moduleIds=dto.ModuleIds.Distinct().ToList();if(await db.Module.CountAsync(x=>moduleIds.Contains(x.Id)&&x.Code!=SystemResourceModuleCode,ct)!=moduleIds.Count)return BadRequest(new{message="One or more selected modules are unavailable for tenant association."});var p=SubscriptionPlan.Create(dto.Name,dto.Description,dto.Price,dto.BillingCycle,dto.MaxUsers,dto.MaxStorageGB,dto.TrialDays); db.SubscriptionPlan.Add(p); foreach(var id in moduleIds) db.SubscriptionPlanModules.Add(SubscriptionPlanModule.Create(p.Id,id)); await db.SaveChangesAsync(ct); return Ok(new {p.Id,p.Code}); }
    [HttpPut("subscription-plans/{id:guid}")] public async Task<IActionResult> UpdatePlan(Guid id, PlanWrite dto, CancellationToken ct) { await Demand(ct); var moduleIds=dto.ModuleIds.Distinct().ToList();if(await db.Module.CountAsync(x=>moduleIds.Contains(x.Id)&&x.Code!=SystemResourceModuleCode,ct)!=moduleIds.Count)return BadRequest(new{message="One or more selected modules are unavailable for tenant association."});var p=await db.SubscriptionPlan.SingleAsync(x=>x.Id==id,ct); p.Update(dto.Name,dto.Description,dto.Price,dto.BillingCycle,dto.MaxUsers,dto.MaxStorageGB,dto.IsActive,dto.TrialDays); var old=await db.SubscriptionPlanModules.Where(x=>x.SubscriptionPlanId==id).ToListAsync(ct); db.RemoveRange(old); foreach(var moduleId in moduleIds) db.SubscriptionPlanModules.Add(SubscriptionPlanModule.Create(id,moduleId)); await db.SaveChangesAsync(ct); return NoContent(); }
    [HttpDelete("subscription-plans/{id:guid}")] public async Task<IActionResult> DeletePlan(Guid id,CancellationToken ct){await Demand(ct);if(await db.OrganizationSubscriptions.AnyAsync(x=>x.SubscriptionPlanId==id,ct))return Conflict(new{message="Subscription plan is assigned to an organization. Deactivate it instead."});var entity=await db.SubscriptionPlan.SingleOrDefaultAsync(x=>x.Id==id,ct);if(entity is null)return NotFound();db.SubscriptionPlanModules.RemoveRange(db.SubscriptionPlanModules.Where(x=>x.SubscriptionPlanId==id));db.SubscriptionPlan.Remove(entity);await db.SaveChangesAsync(ct);return NoContent();}

    [HttpGet("standard-role-templates")]
    public async Task<ActionResult<IReadOnlyList<RoleTemplateDto>>> Templates(CancellationToken ct)
    {
        await Demand(ct);
        return Ok(await db.StandardRoleTemplates.AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new RoleTemplateDto(x.Id, x.Code, x.Name, x.Description, x.IsActive, x.IsPlatformRole))
            .ToListAsync(ct));
    }

    [HttpPost("standard-role-templates")]
    public async Task<ActionResult<RoleTemplateDto>> CreateTemplate(RoleTemplateWrite dto, CancellationToken ct)
    {
        await Demand(ct);
        var template = StandardRoleTemplate.Create(dto.Code, dto.Name, dto.Description, dto.IsPlatformRole, dto.IsActive);
        db.StandardRoleTemplates.Add(template);
        await db.SaveChangesAsync(ct);
        return Ok(ToRoleTemplateDto(template));
    }
    [HttpPut("standard-role-templates/{id:guid}")]
    public async Task<ActionResult<RoleTemplateDto>> UpdateTemplate(Guid id,RoleTemplateWrite dto,CancellationToken ct)
    {
        await Demand(ct);
        var t=await db.StandardRoleTemplates.SingleAsync(x=>x.Id==id,ct);
        if(t.Code=="ADMINISTRATOR"||t.Name=="Administrator") return Conflict(new{message="The Administrator role is system-managed and cannot be edited."});
        t.Update(dto.Name, dto.Description, dto.IsActive, dto.IsPlatformRole);
        db.Entry(t).Property(x => x.IsPlatformRole).IsModified = true;
        db.Entry(t).Property(x => x.IsActive).IsModified = true;
        await db.SaveChangesAsync(ct);
        return Ok(ToRoleTemplateDto(t));
    }
    [HttpDelete("standard-role-templates/{id:guid}")]
    public async Task<IActionResult> DeleteTemplate(Guid id,CancellationToken ct)
    {
        await Demand(ct);
        var entity=await db.StandardRoleTemplates.SingleOrDefaultAsync(x=>x.Id==id,ct);
        if(entity is null)return NotFound();
        if(entity.Code=="ADMINISTRATOR"||entity.Name=="Administrator")return Conflict(new{message="The Administrator role is system-managed and cannot be deleted."});
        var tenantRoleIds = await db.TenantRoles
            .Where(x => x.RoleId == id)
            .Select(x => x.Id)
            .ToListAsync(ct);
        if (await db.TenantUserRoles.AnyAsync(x => tenantRoleIds.Contains(x.TenantRoleId), ct))
            return Conflict(new { message = "Role template is assigned to one or more tenant users. Remove those assignments or deactivate it instead." });

        // An unassigned tenant-role instance is only a materialized copy of the
        // template. It must not make an otherwise unused standard role undeletable.
        if (tenantRoleIds.Count > 0)
        {
            db.TenantRolePermissions.RemoveRange(
                db.TenantRolePermissions.Where(x => tenantRoleIds.Contains(x.TenantRoleId)));
            db.TenantRoles.RemoveRange(
                db.TenantRoles.Where(x => tenantRoleIds.Contains(x.Id)));
        }
        db.StandardRoleTemplates.Remove(entity);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    public sealed record PlanWrite(string Name,string Description,decimal Price,string BillingCycle,int MaxUsers,int MaxStorageGB,int TrialDays,bool IsActive,IReadOnlyList<Guid> ModuleIds);
    private static RoleTemplateDto ToRoleTemplateDto(StandardRoleTemplate role) =>
        new(role.Id, role.Code, role.Name, role.Description, role.IsActive, role.IsPlatformRole);

    public sealed record RoleTemplateDto(Guid Id, string Code, string Name, string Description, bool IsActive, bool IsPlatformRole);
    public sealed record RoleTemplateWrite(string Code, string Name, string Description, bool IsPlatformRole, bool IsActive);
    public sealed record PlatformTenantWrite(Guid OrganizationId,string Identifier,string Name,bool IsActive,IReadOnlyList<Guid>? ModuleIds,Guid? TenantTypeId = null);
    public sealed record PlatformUserWrite(string FullName,string Email,string? PhoneNumber,string UserName,string? Password,bool AccountStatus,bool TwoFactorEnabled,bool IsPlatformAdministrator,IReadOnlyList<Guid>? RoleIds = null,Guid? EmployeeId = null);
}

[ApiController]
[Authorize]
[Route("api")]
public sealed class TenantContextAdministrationController(IMultiTenantControlPlaneService service, SrmsDbContext db) : ControllerBase
{
    private Guid UserId => Guid.TryParse(User.FindFirstValue("UserId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : throw new UnauthorizedAccessException();
    private Guid TenantId => Guid.TryParse(User.FindFirstValue("TenantId"), out var id) && id != Guid.Empty ? id : throw new UnauthorizedAccessException("Select a tenant first.");
    [HttpGet("organization-context/memberships")][HttpGet("tenant-context/memberships")] public async Task<IActionResult> Memberships(CancellationToken ct)=>Ok(await service.GetMembershipsAsync(UserId,ct));
    [HttpPost("organization-context/select")][HttpPost("tenant-context/select")] public async Task<IActionResult> Select(SelectContext dto,CancellationToken ct)
    {
        await service.ValidateSelectionAsync(UserId,dto.OrganizationId,dto.TenantId,ct);
        var claims=User.Claims.Where(x=>x.Type!="TenantId"&&x.Type!="OrganizationId").Select(x=>new Claim(x.Type,x.Value)).ToList();claims.Add(new("OrganizationId",dto.OrganizationId.ToString()));claims.Add(new("TenantId",dto.TenantId.ToString()));
        var timeoutMinutes = await db.PlatformSystemSettings.AsNoTracking().Select(x => (int?)x.SessionTimeoutMinutes).SingleOrDefaultAsync(ct) ?? 30;
        var now = DateTimeOffset.UtcNow;
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,new ClaimsPrincipal(new ClaimsIdentity(claims,CookieAuthenticationDefaults.AuthenticationScheme)),new AuthenticationProperties{IsPersistent=true,IssuedUtc=now,ExpiresUtc=now.AddMinutes(timeoutMinutes),AllowRefresh=true});
        return Ok(new{dto.OrganizationId,dto.TenantId});
    }
    [HttpGet("tenant/modules")][HttpGet("tenant/module-entitlements")] public async Task<IActionResult> Modules(CancellationToken ct)=>Ok(await service.GetEntitlementsAsync(UserId,TenantId,ct));
    [HttpGet("tenant-context/module-tenants/{moduleCode}")]
    public async Task<IActionResult> ModuleTenants(string moduleCode, CancellationToken ct) =>
        Ok(await db.TenantModules.AsNoTracking()
            .Where(x => x.Module.Code == moduleCode && x.Module.IsActive && x.Tenant.IsActive && x.Tenant.Organization.IsActive)
            .OrderBy(x => x.Tenant.Organization.DisplayName)
            .ThenBy(x => x.Tenant.Name)
            .Select(x => x.TenantId)
            .Distinct()
            .ToListAsync(ct));
    [HttpGet("tenant/operations")] public async Task<IActionResult> Operations(CancellationToken ct)=>Ok(await service.GetTenantOperationsAsync(UserId,TenantId,ct));
    [HttpGet("tenant/sub-systems/{subSystemId:guid}/modules")]
    public async Task<IActionResult> SubSystemModules(Guid subSystemId, CancellationToken ct)
    {
        var result = await service.GetTenantSubSystemNavigationAsync(UserId, TenantId, subSystemId, ct);
        return result is null ? NotFound() : Ok(result);
    }
    [HttpGet("tenants/{tenantId:guid}/sub-systems/{subSystemId:guid}/modules")]
    public async Task<IActionResult> SubSystemModules(Guid tenantId, Guid subSystemId, CancellationToken ct)
    {
        var result = await service.GetTenantSubSystemNavigationAsync(UserId, tenantId, subSystemId, ct);
        return result is null ? NotFound() : Ok(result);
    }
    [HttpGet("tenant/modules/{moduleId:guid}/operations")]
    public async Task<IActionResult> ModuleOperations(Guid moduleId, CancellationToken ct)
    {
        var result = await service.GetTenantModuleOperationsAsync(UserId, TenantId, moduleId, ct);
        return result is null ? NotFound() : Ok(result);
    }
    [HttpPost("tenant/sub-systems/{subSystemId:guid}/modules")]
    public async Task<IActionResult> CreateTenantNavigationModule(Guid subSystemId, PlatformOperationWriteDto dto, CancellationToken ct) =>
        Ok(await service.SaveTenantNavigationModuleAsync(UserId, TenantId, subSystemId, null, dto, ct));
    [HttpPut("tenant/sub-systems/{subSystemId:guid}/modules/{id:guid}")]
    public async Task<IActionResult> UpdateTenantNavigationModule(Guid subSystemId, Guid id, PlatformOperationWriteDto dto, CancellationToken ct) =>
        Ok(await service.SaveTenantNavigationModuleAsync(UserId, TenantId, subSystemId, id, dto, ct));
    [HttpDelete("tenant/sub-systems/{subSystemId:guid}/modules/{id:guid}")]
    public async Task<IActionResult> DeleteTenantNavigationModule(Guid subSystemId, Guid id, CancellationToken ct)
    {
        await service.DeleteTenantNavigationModuleAsync(UserId, TenantId, subSystemId, id, ct);
        return NoContent();
    }
    [HttpGet("tenants/{tenantId:guid}/modules/{moduleId:guid}/operations")]
    public async Task<IActionResult> ModuleOperations(Guid tenantId, Guid moduleId, CancellationToken ct)
    {
        var result = await service.GetTenantModuleOperationsAsync(UserId, tenantId, moduleId, ct);
        return result is null ? NotFound() : Ok(result);
    }
    [HttpPut("tenant/operations/{operationId:guid}")] public async Task<IActionResult> SetOperation(Guid operationId, TenantOperationState dto, CancellationToken ct)=>Ok(await service.SetTenantOperationActiveAsync(UserId,TenantId,operationId,dto.IsActive,ct));
    [HttpGet("tenant/roles")] public async Task<IActionResult> Roles(CancellationToken ct)=>Ok(await service.GetRolesAsync(UserId,TenantId,ct));
    [HttpPost("tenant/roles")] public async Task<IActionResult> CreateRole(TenantRoleWriteDto dto,CancellationToken ct)=>Ok(await service.SaveRoleAsync(UserId,TenantId,null,dto,ct));
    [HttpPut("tenant/roles/{id:guid}")] public async Task<IActionResult> UpdateRole(Guid id,TenantRoleWriteDto dto,CancellationToken ct)=>Ok(await service.SaveRoleAsync(UserId,TenantId,id,dto,ct));
    [HttpPut("tenant/roles/{id:guid}/permissions")] public async Task<IActionResult> Permissions(Guid id,IReadOnlyList<TenantRolePermissionDto> permissions,CancellationToken ct){var role=(await service.GetRolesAsync(UserId,TenantId,ct)).Single(x=>x.Id==id);return Ok(await service.SaveRoleAsync(UserId,TenantId,id,new(role.Code,role.Name,role.RoleId,permissions),ct));}
    [HttpDelete("tenant/roles/{id:guid}")]
    public async Task<IActionResult> DeleteRole(Guid id, CancellationToken ct)
    {
        await service.GetTenantUsersAsync(UserId, TenantId, ct);
        var role = await db.TenantRoles.SingleOrDefaultAsync(x => x.Id == id && x.TenantId == TenantId, ct);
        if (role is null) return NotFound();
        if (await db.TenantUserRoles.AnyAsync(x => x.TenantRoleId == id, ct)) return Conflict(new { message = "The role is assigned to users." });
        db.TenantRoles.Remove(role);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
    [HttpGet("tenant/users")] public async Task<IActionResult> Users(CancellationToken ct)=>Ok(await service.GetTenantUsersAsync(UserId,TenantId,ct));
    [HttpGet("tenant/standard-roles")]
    public async Task<IActionResult> StandardRoles(CancellationToken ct)
    {
        await service.GetTenantUsersAsync(UserId,TenantId,ct);
        return Ok(await db.StandardRoleTemplates.AsNoTracking()
            .Where(x=>x.IsActive && !x.IsPlatformRole)
            .OrderBy(x=>x.Name)
            .Select(x=>new{x.Id,x.Code,x.Name,x.Description})
            .ToListAsync(ct));
    }
    [HttpGet("tenant/available-users")]
    public async Task<IActionResult> AvailableUsers(CancellationToken ct)
    {
        await service.GetTenantUsersAsync(UserId, TenantId, ct);
        return Ok(await db.User.AsNoTracking()
            .Where(x => x.AccountStatus
                && !x.IsPlatformAdministrator
                && !db.TenantUsers.Any(m => m.TenantId == TenantId && m.UserId == x.Id))
            .OrderBy(x => x.FullName)
            .Select(x => new
            {
                x.Id,
                x.FullName,
                x.Email,
                x.PhoneNumber,
                x.UserName,
                ProfilePictureUrl = x.ProfilePicture == null ? null : $"/api/v1.0/User/{x.Id}/profile-picture"
            })
            .ToListAsync(ct));
    }
    [HttpPost("tenant/users")][HttpPut("tenant/users/{ignored:guid}")] public async Task<IActionResult> SaveUser(TenantUserWriteDto dto,CancellationToken ct)=>Ok(await service.SaveTenantUserAsync(UserId,TenantId,dto,ct));
    [HttpDelete("tenant/users/{membershipId:guid}")] public async Task<IActionResult> RemoveUser(Guid membershipId,CancellationToken ct){await service.RemoveTenantUserAsync(UserId,TenantId,membershipId,ct);return NoContent();}
    public sealed record SelectContext(Guid OrganizationId,Guid TenantId);
    public sealed record TenantOperationState(bool IsActive);
}

[ApiController]
[Authorize]
[Route("api/organization")]
public sealed class OrganizationAdministrationController(SrmsDbContext db, IMultiTenantControlPlaneService service, IConfiguration configuration, IWebHostEnvironment environment) : ControllerBase
{
    private Guid UserId => Guid.TryParse(User.FindFirstValue("UserId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : throw new UnauthorizedAccessException();
    private Guid OrganizationId => Guid.TryParse(User.FindFirstValue("OrganizationId"), out var id) ? id : throw new UnauthorizedAccessException("Select an organization first.");
    private async Task Demand(CancellationToken ct) { if(environment.IsDevelopment()&&configuration.GetValue<bool>("Security:BypassAuthorization"))return;await service.EnsurePlatformAdministratorAsync(UserId,ct); }
    [HttpGet("profile")] public async Task<IActionResult> Profile(CancellationToken ct){await Demand(ct);return Ok((await service.GetOrganizationsAsync(ct)).Single(x=>x.Id==OrganizationId));}
    [HttpPut("profile")] public async Task<IActionResult> Profile(OrganizationWriteDto dto,CancellationToken ct){await Demand(ct);return Ok(await service.SaveOrganizationAsync(OrganizationId,dto,ct));}
    [HttpGet("tenants")] public async Task<IActionResult> Tenants(CancellationToken ct){await Demand(ct);return Ok(await db.Tenant.AsNoTracking().Where(x=>x.OrganizationId==OrganizationId).Select(x=>new TenantSummaryDto(x.Id,x.OrganizationId,x.Identifier,x.Name,x.IsActive,x.TenantTypeId,x.TenantType==null?null:x.TenantType.Name)).ToListAsync(ct));}
    [HttpGet("administrators")] public async Task<IActionResult> Administrators(CancellationToken ct){await Demand(ct);return Ok(await db.User.AsNoTracking().Where(x=>x.AccountStatus&&x.UserRoles.Any(r=>r.Role.IsActive&&(r.Role.Code=="ADMINISTRATOR"||r.Role.Name=="Administrator"))).Select(x=>new{x.Id,UserId=x.Id,x.UserName,x.Email,Status=x.AccountStatus,IsOrganizationAdministrator=true}).ToListAsync(ct));}
    [HttpGet("subscription")] public async Task<IActionResult> Subscription(CancellationToken ct){await Demand(ct);return Ok(await db.OrganizationSubscriptions.AsNoTracking().Where(x=>x.OrganizationId==OrganizationId).OrderByDescending(x=>x.StartDate).Select(x=>new{x.Id,PlanId=x.SubscriptionPlanId,x.SubscriptionPlan.Name,Status=x.Status.ToString(),x.Currency,x.StartDate,x.EndDate,x.AutoRenew}).ToListAsync(ct));}
}
