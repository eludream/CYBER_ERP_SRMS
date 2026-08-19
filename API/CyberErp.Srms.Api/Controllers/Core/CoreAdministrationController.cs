using CyberErp.Srms.Api.Controllers;
using CyberErp.Srms.Dom.Entities.Core;
using CyberErp.Srms.Inf.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CyberErp.Srms.Api.Controllers.Core;

public class CoreAdministrationController(SrmsDbContext db) : BaseController
{
    private string TenantId => User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenant_id")?.Value ?? string.Empty;

    [HttpGet("users")]
    public async Task<IReadOnlyList<AdminUserDto>> GetUsers(CancellationToken ct)
    {
        var tenantId = TenantId;
        var tenantGuid = CurrentTenantGuid();
        var users = await db.TenantUsers.AsNoTracking()
            .Where(x => x.TenantId == tenantGuid && x.Status == MembershipStatus.Active)
            .Select(x => x.User)
            .ToListAsync(ct);
        var userRoles = await db.UserRole.AsNoTracking().ToListAsync(ct);
        var roles = await db.StandardRoleTemplates.AsNoTracking().ToDictionaryAsync(x => x.Id, x => x.Name, ct);
        var lastLogins = await db.LoginTrail.AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.UserId != null && x.Status == "Success")
            .GroupBy(x => x.UserId!.Value).Select(g => new { UserId = g.Key, Date = g.Max(x => x.Date) })
            .ToDictionaryAsync(x => x.UserId, x => (DateTime?)x.Date, ct);

        return users.Select(x => new AdminUserDto(
            x.Id, x.EmployeeId, x.FullName, x.Email, x.PhoneNumber ?? string.Empty, x.UserName, x.AccountStatus,
            x.TwoFactorEnabled, x.FailedLoginAttempts, x.LockoutEndUtc, x.CreatedAt.ToDateTimeUtc(),
            lastLogins.GetValueOrDefault(x.Id),
            userRoles.Where(ur => ur.UserId == x.Id).Select(ur => roles.GetValueOrDefault(ur.RoleId)).Where(n => n != null).Cast<string>().ToArray(),
            x.ProfilePicture != null ? $"/api/v1.0/User/{x.Id}/profile-picture" : null
        )).ToList();
    }

    [HttpPut("users/{id:guid}/security")]
    public async Task<IActionResult> UpdateUserSecurity(Guid id, [FromBody] UpdateUserSecurityRequest request, CancellationToken ct)
    {
        var user = await FindTenantUser(id, ct);
        if (user is null) return NotFound();
        user.UpdateSecurity(request.AccountStatus, request.TwoFactorEnabled, request.LockoutEndUtc);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("users/{id:guid}/preferences")]
    public async Task<IActionResult> GetUserPreferences(Guid id, CancellationToken ct)
    {
        if (!await IsTenantUser(id, ct)) return NotFound();
        var preference = await db.UserPreference.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == id, ct);
        return Ok(preference is null
            ? new UserPreferenceResponse("en", "Africa/Nairobi", "dd/MM/yyyy", "1,234.56", "/", "system", true, true, true)
            : new UserPreferenceResponse(preference.Language, preference.TimeZone, preference.DateFormat, preference.NumberFormat,
                preference.LandingPage, preference.Theme, preference.EmailNotifications, preference.InAppNotifications, preference.ApprovalNotifications));
    }

    [HttpPut("users/{id:guid}/preferences")]
    public async Task<IActionResult> UpdateUserPreferences(Guid id, [FromBody] UserPreferenceRequest request, CancellationToken ct)
    {
        var tenantId = TenantId;
        if (!await IsTenantUser(id, ct)) return NotFound();
        var preference = await db.UserPreference.FirstOrDefaultAsync(x => x.UserId == id, ct);
        if (preference is null)
        {
            preference = UserPreference.Create(id, tenantId);
            db.UserPreference.Add(preference);
        }
        preference.UpdatePreferences(request.Language, request.TimeZone, request.DateFormat, request.NumberFormat,
            request.LandingPage, request.Theme, request.EmailNotifications, request.InAppNotifications, request.ApprovalNotifications);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPut("users/{id:guid}/roles")]
    public async Task<IActionResult> UpdateUserRoles(Guid id, [FromBody] UpdateUserRolesRequest request, CancellationToken ct)
    {
        var tenantId = TenantId;
        if (!await IsTenantUser(id, ct)) return NotFound();
        var validRoleIds = await db.StandardRoleTemplates.Where(x => x.IsPlatformRole && x.IsActive && request.RoleIds.Contains(x.Id)).Select(x => x.Id).ToListAsync(ct);
        if (validRoleIds.Count != request.RoleIds.Distinct().Count()) return BadRequest("One or more roles are inactive or are not platform roles.");
        var existing = await db.UserRole.Where(x => x.UserId == id).ToListAsync(ct);
        db.UserRole.RemoveRange(existing.Where(x => !validRoleIds.Contains(x.RoleId)));
        foreach (var roleId in validRoleIds.Where(roleId => existing.All(x => x.RoleId != roleId)))
        {
            var userRole = UserRole.Create(roleId, id);
            db.UserRole.Add(userRole);
        }
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("roles")]
    public async Task<IReadOnlyList<AdminRoleDto>> GetRoles(CancellationToken ct)
    {
        var roles = await db.StandardRoleTemplates.AsNoTracking().OrderBy(x => x.Name).ToListAsync(ct);
        var userCounts = await db.UserRole.AsNoTracking()
            .GroupBy(x => x.RoleId).ToDictionaryAsync(x => x.Key, x => x.Count(), ct);
        return roles.Select(x => new AdminRoleDto(x.Id, x.Name, x.Code, x.Description, x.IsActive, x.IsPlatformRole, userCounts.GetValueOrDefault(x.Id), [])).ToList();
    }

    [HttpPost("roles")]
    public async Task<ActionResult<AdminRoleDto>> CreateRole([FromBody] SaveRoleRequest request, CancellationToken ct)
    {
        var role = StandardRoleTemplate.Create(request.Code ?? request.Name, request.Name, request.Description ?? string.Empty, request.IsPlatformRole);
        db.StandardRoleTemplates.Add(role);
        await db.SaveChangesAsync(ct);
        await SavePermissions(role.Id, request.Permissions, ct);
        return new AdminRoleDto(role.Id, role.Name, role.Code, role.Description, role.IsActive, role.IsPlatformRole, 0, await GetRolePermissions(role.Id, ct));
    }

    [HttpPut("roles/{id:guid}")]
    public async Task<ActionResult<AdminRoleDto>> UpdateRole(Guid id, [FromBody] SaveRoleRequest request, CancellationToken ct)
    {
        var role = await db.StandardRoleTemplates.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (role is null) return NotFound();
        role.Update(request.Name, request.Description ?? string.Empty, isPlatformRole: request.IsPlatformRole);
        await SavePermissions(id, request.Permissions, ct);
        var userCount = await db.UserRole.CountAsync(x => x.RoleId == id, ct);
        return new AdminRoleDto(role.Id, role.Name, role.Code, role.Description, role.IsActive, role.IsPlatformRole, userCount, await GetRolePermissions(id, ct));
    }

    [HttpDelete("roles/{id:guid}")]
    public async Task<IActionResult> DeleteRole(Guid id, CancellationToken ct)
    {
        var role = await db.StandardRoleTemplates.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (role is null) return NotFound();
        if (await db.UserRole.AnyAsync(x => x.RoleId == id, ct)) return Conflict("The role is assigned to users.");
        db.StandardRoleTemplates.Remove(role);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private async Task SavePermissions(Guid roleId, IReadOnlyList<SavePermissionRequest> requests, CancellationToken ct)
    {
        await Task.CompletedTask;
    }

    private Task<AdminPermissionDto[]> GetRolePermissions(Guid roleId, CancellationToken ct) =>
        Task.FromResult(Array.Empty<AdminPermissionDto>());

    [HttpGet("login-logs")]
    public async Task<IReadOnlyList<LoginLogDto>> GetLoginLogs(CancellationToken ct)
    {
        var tenantId = TenantId;
        return await (from log in db.LoginTrail.AsNoTracking()
                      join user in db.User.AsNoTracking() on log.UserId equals user.Id into users
                      from user in users.DefaultIfEmpty()
                      where log.TenantId == tenantId
                      orderby log.Date descending
                      select new LoginLogDto(log.Id, log.Date, user != null ? user.FullName : log.UserNameAttempted,
                          log.UserNameAttempted, log.IpAddress, log.UserAgent, log.Status, log.FailureReason, log.EventType))
            .Take(500).ToListAsync(ct);
    }

    [HttpGet("workflow-profiles")]
    public async Task<IReadOnlyList<WorkflowProfileDto>> GetWorkflowProfiles(CancellationToken ct) =>
        await db.WorkflowProfile.AsNoTracking().Where(x => x.TenantId == TenantId)
            .OrderBy(x => x.Name)
            .Select(x => new WorkflowProfileDto(x.Id, x.Name, x.Description, x.Module, x.DocumentType, x.IsActive, x.Version, x.DefinitionJson))
            .ToListAsync(ct);

    [HttpPost("workflow-profiles")]
    public async Task<ActionResult<WorkflowProfileDto>> CreateWorkflowProfile([FromBody] SaveWorkflowProfileRequest request, CancellationToken ct)
    {
        var profile = WorkflowProfile.Create(request.Name, request.Description, request.Module, request.DocumentType, request.DefinitionJson);
        profile.TenantId = TenantId;
        db.WorkflowProfile.Add(profile);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetWorkflowProfiles), new WorkflowProfileDto(profile.Id, profile.Name, profile.Description, profile.Module, profile.DocumentType, profile.IsActive, profile.Version, profile.DefinitionJson));
    }

    [HttpPut("workflow-profiles/{id:guid}")]
    public async Task<ActionResult<WorkflowProfileDto>> UpdateWorkflowProfile(Guid id, [FromBody] SaveWorkflowProfileRequest request, CancellationToken ct)
    {
        var profile = await db.WorkflowProfile.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == TenantId, ct);
        if (profile is null) return NotFound();
        profile.UpdateProfile(request.Name, request.Description, request.Module, request.DocumentType, request.IsActive, request.DefinitionJson);
        await db.SaveChangesAsync(ct);
        return new WorkflowProfileDto(profile.Id, profile.Name, profile.Description, profile.Module, profile.DocumentType, profile.IsActive, profile.Version, profile.DefinitionJson);
    }

    [HttpDelete("workflow-profiles/{id:guid}")]
    public async Task<IActionResult> DeleteWorkflowProfile(Guid id, CancellationToken ct)
    {
        var profile = await db.WorkflowProfile.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == TenantId, ct);
        if (profile is null) return NotFound();
        db.WorkflowProfile.Remove(profile);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private Guid CurrentTenantGuid() =>
        Guid.TryParse(TenantId, out var tenantId) && tenantId != Guid.Empty
            ? tenantId
            : throw new UnauthorizedAccessException("Select a tenant first.");

    private Task<bool> IsTenantUser(Guid userId, CancellationToken ct)
    {
        var tenantId = CurrentTenantGuid();
        return db.TenantUsers.AsNoTracking().AnyAsync(
            x => x.UserId == userId && x.TenantId == tenantId && x.Status == MembershipStatus.Active, ct);
    }

    private async Task<User?> FindTenantUser(Guid userId, CancellationToken ct)
    {
        var tenantId = CurrentTenantGuid();
        return await db.User.FirstOrDefaultAsync(x => x.Id == userId &&
            db.TenantUsers.Any(m => m.UserId == x.Id && m.TenantId == tenantId && m.Status == MembershipStatus.Active), ct);
    }
}

public record AdminUserDto(Guid Id, Guid? EmployeeId, string FullName, string Email, string PhoneNumber, string UserName, bool AccountStatus,
    bool TwoFactorEnabled, int FailedLoginAttempts, DateTime? LockoutEndUtc, DateTime CreatedAt, DateTime? LastLoginUtc, string[] Roles,
    string? ProfilePictureUrl);
public record UpdateUserSecurityRequest(bool AccountStatus, bool TwoFactorEnabled, DateTime? LockoutEndUtc);
public record UpdateUserRolesRequest(Guid[] RoleIds);
public record AdminRoleDto(Guid Id, string Name, string? Code, string? Description, bool IsActive, bool IsPlatformRole, int UserCount, AdminPermissionDto[] Permissions);
public record AdminPermissionDto(Guid RoleId, string Module, string Operation, bool CanView, bool CanAdd, bool CanEdit, bool CanDelete, bool CanApprove, bool CanExport);
public record SaveRoleRequest(string Name, string? Code, string? Description, bool IsPlatformRole, SavePermissionRequest[] Permissions);
public record SavePermissionRequest(string Module, string Operation, bool CanView, bool CanAdd, bool CanEdit, bool CanDelete, bool CanApprove, bool CanExport);
public record LoginLogDto(Guid Id, DateTime Timestamp, string User, string UserNameAttempted, string IpAddress, string? UserAgent, string? Status, string? FailureReason, string EventType);
public record WorkflowProfileDto(Guid Id, string Name, string? Description, string Module, string DocumentType, bool IsActive, int Version, string DefinitionJson);
public record SaveWorkflowProfileRequest(string Name, string? Description, string Module, string DocumentType, bool IsActive, string DefinitionJson);
