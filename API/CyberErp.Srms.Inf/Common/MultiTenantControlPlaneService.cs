using CyberErp.Srms.App.Common;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.Dom.Entities.Core;
using CyberErp.Srms.Inf.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace CyberErp.Srms.Inf.Common;

public sealed class MultiTenantControlPlaneService(SrmsDbContext db, IHostEnvironment environment, IConfiguration configuration) : IMultiTenantControlPlaneService
{
    private const string SystemResourceModuleCode = SystemResourceSubSystem.Code;
    private const string SecurityAdministrationModuleCode = "002";
    private const string SecurityAdministrationModuleAbbreviation = "SAMS";
    private const string SystemSettingsModuleCode = "003";
    private const string SystemSettingsModuleAbbreviation = "SSMS";
    private bool BypassAuthorization => environment.IsDevelopment() && configuration.GetValue<bool>("Security:BypassAuthorization");

    public async Task EnsurePlatformAdministratorAsync(Guid userId, CancellationToken ct)
    {
        if (BypassAuthorization) return;
        if (!await db.UserRole.AsNoTracking().AnyAsync(x =>
                x.UserId == userId &&
                x.User.AccountStatus &&
                x.Role.IsActive &&
                (x.Role.Code == "ADMINISTRATOR" || x.Role.Name == "Administrator"), ct))
            throw new UnauthorizedAccessException("Platform administrator access is required.");
    }

    public async Task<IReadOnlyList<OrganizationDto>> GetOrganizationsAsync(CancellationToken ct) =>
        await db.Organizations.AsNoTracking().OrderBy(x => x.DisplayName).Select(x => new OrganizationDto(x.Id, x.Code, x.LegalName, x.DisplayName, x.Currency, x.Timezone, x.Locale, x.DateFormat, x.IsActive,
            x.Logo == null ? null : "/api/platform/organizations/" + x.Id + "/logo",x.Address,x.PhoneNumber,x.Email,x.RegistrationNumber,x.TaxNumber,x.OrganizationType,x.Industry,x.Website,x.PostalAddress,x.Country,x.Region,x.City,x.PostalCode,
            x.PrimaryContactName,x.PrimaryContactTitle,x.PrimaryContactEmail,x.PrimaryContactPhone,x.FiscalYearStartMonth,x.DefaultLanguage,x.DataRetentionPolicy,x.RegulatoryIdentifiers,x.TINNumber)).ToListAsync(ct);

    public async Task<OrganizationDto> SaveOrganizationAsync(Guid? id, OrganizationWriteDto dto, CancellationToken ct)
    {
        Organization entity;
        if (id.HasValue)
        {
            entity = await db.Organizations.SingleAsync(x => x.Id == id, ct);
            ApplyOrganization(entity,dto);
        }
        else
        {
            entity = Organization.Create(dto.Code, dto.LegalName, dto.DisplayName, dto.Currency, dto.Timezone, dto.Locale, dto.DateFormat);
            ApplyOrganization(entity,dto);
            db.Organizations.Add(entity);
        }
        await db.SaveChangesAsync(ct);
        return ToOrganizationDto(entity);
    }

    private static void ApplyOrganization(Organization entity,OrganizationWriteDto dto) => entity.Update(dto.Code,dto.LegalName,dto.DisplayName,dto.Address,dto.PhoneNumber,dto.Email,dto.Currency,dto.Timezone,dto.Locale,dto.DateFormat,dto.IsActive,
        dto.RegistrationNumber,dto.TaxNumber,dto.TINNumber,dto.OrganizationType,dto.Industry,dto.Website,dto.PostalAddress,dto.Country,dto.Region,dto.City,dto.PostalCode,dto.PrimaryContactName,dto.PrimaryContactTitle,
        dto.PrimaryContactEmail,dto.PrimaryContactPhone,dto.FiscalYearStartMonth,dto.DefaultLanguage,dto.DataRetentionPolicy,dto.RegulatoryIdentifiers);
    private static OrganizationDto ToOrganizationDto(Organization x) => new(x.Id,x.Code,x.LegalName,x.DisplayName,x.Currency,x.Timezone,x.Locale,x.DateFormat,x.IsActive,x.Logo is null ? null : $"/api/platform/organizations/{x.Id}/logo",x.Address,x.PhoneNumber,x.Email,
        x.RegistrationNumber,x.TaxNumber,x.OrganizationType,x.Industry,x.Website,x.PostalAddress,x.Country,x.Region,x.City,x.PostalCode,x.PrimaryContactName,x.PrimaryContactTitle,x.PrimaryContactEmail,
        x.PrimaryContactPhone,x.FiscalYearStartMonth,x.DefaultLanguage,x.DataRetentionPolicy,x.RegulatoryIdentifiers,x.TINNumber);

    public async Task<TenantSummaryDto> SaveTenantAsync(Guid? id, TenantWriteDto dto, CancellationToken ct)
    {
        if (!await db.Organizations.AnyAsync(x => x.Id == dto.OrganizationId && x.IsActive, ct)) throw new InvalidOperationException("A valid active Organization must exist before a Tenant.");
        if (dto.TenantTypeId.HasValue && !await db.LookupCategoryItems.AnyAsync(x => x.Id == dto.TenantTypeId, ct)) throw new InvalidOperationException("Tenant type does not exist.");
        if (await db.Tenant.AnyAsync(x => x.OrganizationId == dto.OrganizationId && x.Identifier == dto.Identifier.Trim() && (!id.HasValue || x.Id != id.Value), ct))
            throw new InvalidOperationException("A tenant with this identifier already exists.");
        Tenant entity;
        if (id.HasValue)
        {
            entity = await db.Tenant.SingleAsync(x => x.Id == id && x.OrganizationId == dto.OrganizationId, ct);
            entity.Update(dto.Name, dto.Identifier, isActive: dto.IsActive, tenantTypeId: dto.TenantTypeId);
        }
        else { entity = Tenant.Create(dto.OrganizationId, dto.Name, dto.Identifier, tenantTypeId: dto.TenantTypeId); db.Tenant.Add(entity); }
        await db.SaveChangesAsync(ct);
        var tenantTypeName = entity.TenantTypeId.HasValue ? await db.LookupCategoryItems.Where(x => x.Id == entity.TenantTypeId).Select(x => x.Name).SingleOrDefaultAsync(ct) : null;
        return new(entity.Id, entity.OrganizationId, entity.Identifier, entity.Name, entity.IsActive, entity.TenantTypeId, tenantTypeName);
    }

    public async Task<OrganizationDto> OnboardOrganizationAsync(OrganizationOnboardingDto dto, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var org = Organization.Create(dto.Organization.Code, dto.Organization.LegalName, dto.Organization.DisplayName, dto.Organization.Currency, dto.Organization.Timezone, dto.Organization.Locale, dto.Organization.DateFormat);
        ApplyOrganization(org, dto.Organization);
        db.Organizations.Add(org);
        if (!await db.UserRole.AnyAsync(x => x.UserId == dto.AdministratorUserId && x.User.AccountStatus && x.Role.IsActive &&
                (x.Role.Code == "ADMINISTRATOR" || x.Role.Name == "Administrator"), ct))
            throw new InvalidOperationException("The selected user is not an active Administrator.");
        if (dto.PlanId.HasValue)
        {
            if (!await db.SubscriptionPlan.AnyAsync(x => x.Id == dto.PlanId, ct)) throw new InvalidOperationException("Subscription plan does not exist.");
            db.OrganizationSubscriptions.Add(OrganizationSubscription.Create(org.Id, dto.PlanId.Value, dto.SubscriptionStartDate ?? DateTime.UtcNow, dto.SubscriptionEndDate, dto.Organization.Currency, true));
        }
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        return ToOrganizationDto(org);
    }

    public async Task<TenantSummaryDto> OnboardTenantAsync(TenantOnboardingDto dto, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        if (!await db.Organizations.AnyAsync(x => x.Id == dto.Tenant.OrganizationId && x.IsActive, ct)) throw new InvalidOperationException("Organization does not exist or is inactive.");
        var administrator=await db.User.AsNoTracking().SingleOrDefaultAsync(x=>x.Id==dto.AdministratorUserId&&x.AccountStatus,ct)
            ?? throw new InvalidOperationException("Administrator user does not exist or is inactive.");
        var isPlatformAdministrator=await IsActivePlatformAdministrator(administrator.Id,ct);
        if (dto.Tenant.TenantTypeId.HasValue && !await db.LookupCategoryItems.AnyAsync(x => x.Id == dto.Tenant.TenantTypeId, ct)) throw new InvalidOperationException("Tenant type does not exist.");
        var tenant = Tenant.Create(dto.Tenant.OrganizationId, dto.Tenant.Name, dto.Tenant.Identifier, tenantTypeId: dto.Tenant.TenantTypeId); db.Tenant.Add(tenant);
        var mandatoryModuleIds = await db.Module
            .Where(x => x.IsActive &&
                (x.Code == SecurityAdministrationModuleCode || x.Abbreviation == SecurityAdministrationModuleAbbreviation ||
                 x.Code == SystemSettingsModuleCode || x.Abbreviation == SystemSettingsModuleAbbreviation))
            .Select(x => x.Id)
            .Distinct()
            .ToListAsync(ct);
        if (mandatoryModuleIds.Count != 2) throw new InvalidOperationException("The mandatory SAMS (002) and SSMS (003) subsystems must be configured and active.");
        var moduleIds = dto.ModuleIds.Concat(mandatoryModuleIds).Distinct().ToList();
        var modules = await db.Module.Where(x => moduleIds.Contains(x.Id) && x.IsActive && x.Code != SystemResourceModuleCode).ToListAsync(ct);
        if (modules.Count != moduleIds.Count) throw new InvalidOperationException("One or more modules do not exist or are inactive.");
        foreach (var module in modules) db.TenantModules.Add(TenantModule.Create(tenant.OrganizationId, tenant.Id, module.Id, DateTime.UtcNow, null, EntitlementSourceType.BasePlan));
        var navigationModules = await db.NavigationModules.Where(x => moduleIds.Contains(x.SubSystemId)).ToListAsync(ct);
        var tenantNavigationModules = navigationModules.Select(source => TenantNavigationModule.Copy(tenant.Id, source)).ToList();
        db.TenantNavigationModules.AddRange(tenantNavigationModules);
        var navigationModuleMap = navigationModules.Zip(tenantNavigationModules).ToDictionary(pair => pair.First.Id, pair => pair.Second.Id);
        var assignedOperations = await db.Operation.Where(x => moduleIds.Contains(x.Module.SubSystemId)).ToListAsync(ct);
        var tenantOperations = assignedOperations
            .Where(operation => navigationModuleMap.ContainsKey(operation.ModuleId))
            .Select(operation => TenantOperation.Copy(tenant.Id, operation, navigationModuleMap[operation.ModuleId]))
            .ToList();
        db.TenantOperations.AddRange(tenantOperations);
        StandardRoleTemplate? template = dto.AdministratorTemplateId.HasValue ? await db.StandardRoleTemplates.SingleAsync(x => x.Id == dto.AdministratorTemplateId, ct) : null;
        var role = TenantRole.Create(tenant.Id, "TENANT_ADMINISTRATOR", "Tenant Administrator", template?.Id); db.TenantRoles.Add(role);
        foreach (var tenantOperation in tenantOperations) db.TenantRolePermissions.Add(TenantRolePermission.Create(role.Id, tenantOperation.Id, true, true, true, true, true));
        if(!isPlatformAdministrator)
        {
            var membership=TenantUser.Create(tenant.Id,dto.AdministratorUserId,true);
            db.TenantUsers.Add(membership);
            db.TenantUserRoles.Add(TenantUserRole.Create(membership.Id,role.Id,dto.AdministratorUserId));
        }
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        var tenantTypeName = tenant.TenantTypeId.HasValue ? await db.LookupCategoryItems.Where(x => x.Id == tenant.TenantTypeId).Select(x => x.Name).SingleOrDefaultAsync(ct) : null;
        return new(tenant.Id, tenant.OrganizationId, tenant.Identifier, tenant.Name, tenant.IsActive, tenant.TenantTypeId, tenantTypeName);
    }

    public async Task<IReadOnlyList<PlatformModuleDto>> GetModulesAsync(CancellationToken ct) => await db.Module.AsNoTracking().OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name).Select(x => new PlatformModuleDto(x.Id, x.Code, x.Name, x.Description, x.LandingPath, x.Icon, x.DisplayOrder, x.IsActive, x.Abbreviation)).ToListAsync(ct);
    public async Task<PlatformModuleDto> SaveModuleAsync(Guid? id, PlatformModuleWriteDto dto, CancellationToken ct)
    {
        Module m;
        var abbreviation = (dto.Abbreviation ?? string.Empty).Trim();
        var landingPath = SystemResourceSubSystem.IsMatch(dto.Code)
            ? SystemResourceSubSystem.RouteBasePath(abbreviation)
            : dto.LandingPath;
        if (id.HasValue)
        {
            if (await db.Module.AnyAsync(x => x.Code == dto.Code.Trim().ToLower() && x.Id != id.Value, ct))
                throw new InvalidOperationException("A module with this code already exists.");
            m = await db.Module.SingleAsync(x => x.Id == id, ct);
            m.Update(dto.Code, dto.SubSystem, dto.Name, dto.Description, landingPath, dto.Icon, dto.DisplayOrder, dto.IsActive, abbreviation);
        }
        else
        {
            var existingValues = await db.Module.AsNoTracking()
                .Select(x => new { x.Code, x.DisplayOrder })
                .ToListAsync(ct);
            var numericCodes = existingValues
                .Select(x => int.TryParse(x.Code, out var code) ? code : 0);
            var nextCode = (numericCodes.DefaultIfEmpty(0).Max() + 1).ToString("D3");
            var nextDisplayOrder = existingValues.Select(x => x.DisplayOrder).DefaultIfEmpty(0).Max() + 1;

            m = Module.Create(nextCode, dto.SubSystem, dto.Name, dto.Description, landingPath, dto.Icon, nextDisplayOrder, dto.IsActive, abbreviation);
            db.Module.Add(m);
        }
        await db.SaveChangesAsync(ct); return new(m.Id, m.Code, m.Name, m.Description, m.LandingPath, m.Icon, m.DisplayOrder, m.IsActive, m.Abbreviation);
    }
    public async Task<IReadOnlyList<PlatformOperationDto>> GetOperationsAsync(Guid moduleId, CancellationToken ct)
    {
        await EnsureOperationEditorAvailable(moduleId, ct);
        var navigationModules = await db.NavigationModules.AsNoTracking().Where(x => x.SubSystemId == moduleId)
            .Select(x => new PlatformOperationDto(x.Id, x.SubSystemId, null, x.Name, string.Empty, x.Filter, x.Icon, x.DisplayOrder, x.IsActive)).ToListAsync(ct);
        var operations = await db.Operation.AsNoTracking().Where(x => x.Module.SubSystemId == moduleId)
            .Select(x => new PlatformOperationDto(x.Id, x.Module.SubSystemId, x.ModuleId, x.Name, x.Link, x.Filter, x.Icon, x.DisplayOrder, x.IsActive)).ToListAsync(ct);
        return navigationModules.Concat(operations).OrderBy(x => x.ParentOperationId.HasValue).ThenBy(x => x.DisplayOrder).ThenBy(x => x.Name).ToList();
    }
    public async Task<PlatformOperationDto> SaveOperationAsync(Guid moduleId, Guid? id, PlatformOperationWriteDto dto, CancellationToken ct)
    {
        await EnsureOperationEditorAvailable(moduleId, ct);
        if (!dto.ParentOperationId.HasValue)
        {
            NavigationModule navigationModule;
            if (id.HasValue)
            {
                navigationModule = await db.NavigationModules.SingleAsync(x => x.Id == id && x.SubSystemId == moduleId, ct);
                navigationModule.Update(dto.Name, dto.Filter, dto.Icon, dto.DisplayOrder, dto.IsActive);
            }
            else
            {
                var displayOrder = await NextPlatformOperationOrder(moduleId, null, null, ct);
                navigationModule = NavigationModule.Create(moduleId, dto.Name, dto.Filter, dto.Icon, displayOrder, dto.IsActive);
                db.NavigationModules.Add(navigationModule);
            }
            await db.SaveChangesAsync(ct);
            return new(navigationModule.Id, moduleId, null, navigationModule.Name, string.Empty, navigationModule.Filter, navigationModule.Icon, navigationModule.DisplayOrder, navigationModule.IsActive);
        }
        Operation op;
        if (id.HasValue)
        {
            op = await db.Operation.SingleAsync(x => x.Id == id && x.Module.SubSystemId == moduleId, ct);
            var displayOrder = op.ModuleId == dto.ParentOperationId
                ? dto.DisplayOrder
                : await NextPlatformOperationOrder(moduleId, dto.ParentOperationId, id, ct);
            op.Update(dto.ParentOperationId.Value, dto.Name, dto.Link, dto.Filter, dto.Icon, displayOrder, dto.IsActive);
        }
        else
        {
            var displayOrder = await NextPlatformOperationOrder(moduleId, dto.ParentOperationId, null, ct);
            op = Operation.Create(dto.ParentOperationId.Value, dto.Name, dto.Link, dto.Filter, dto.Icon, displayOrder, dto.IsActive);
            db.Operation.Add(op);
        }
        await db.SaveChangesAsync(ct); return new(op.Id, moduleId, op.ModuleId, op.Name, op.Link, op.Filter, op.Icon, op.DisplayOrder, op.IsActive);
    }
    private async Task<int> NextPlatformOperationOrder(Guid moduleId, Guid? parentOperationId, Guid? excludedId, CancellationToken ct)
    {
        if (!parentOperationId.HasValue)
            return (await db.NavigationModules.AsNoTracking().Where(x => x.SubSystemId == moduleId && (!excludedId.HasValue || x.Id != excludedId.Value)).Select(x => x.DisplayOrder).ToListAsync(ct)).DefaultIfEmpty(0).Max() + 1;
        var orders = await db.Operation.AsNoTracking().Where(x => x.ModuleId == parentOperationId && (!excludedId.HasValue || x.Id != excludedId.Value)).Select(x => x.DisplayOrder).ToListAsync(ct);
        return orders.DefaultIfEmpty(0).Max() + 1;
    }
    private async Task EnsureOperationEditorAvailable(Guid moduleId, CancellationToken ct)
    {
        var code = await db.Module.AsNoTracking().Where(x => x.Id == moduleId).Select(x => x.Code).SingleOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("Module does not exist.");
        if (code == SystemResourceModuleCode)
            throw new InvalidOperationException("System Resource does not support operation menus.");
    }

    public async Task<IReadOnlyList<MembershipDto>> GetMembershipsAsync(Guid userId, CancellationToken ct)
    {
        // Authorization bypass must not broaden an ordinary user's tenant scope.
        // Tenant memberships are identity context, not a feature permission.
        if (await IsActivePlatformAdministrator(userId, ct))
            return await db.Tenant.AsNoTracking()
                .Where(x => x.IsActive && x.Organization.IsActive)
                .OrderBy(x => x.Organization.DisplayName)
                .ThenBy(x => x.Name)
                .Select(x => new MembershipDto(x.OrganizationId, x.Organization.DisplayName, x.Id, x.Name, true, false, true))
                .ToListAsync(ct);

        return await db.TenantUsers.AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => new MembershipDto(x.Tenant.OrganizationId, x.Tenant.Organization.DisplayName, x.TenantId, x.Tenant.Name,
                x.RoleAssignments.Any(r => r.TenantRole.Code == "TENANT_ADMINISTRATOR"), x.IsDefaultTenant,
                x.Status == MembershipStatus.Active && x.Tenant.IsActive && x.Tenant.Organization.IsActive))
            .ToListAsync(ct);
    }
    public async Task ValidateSelectionAsync(Guid userId, Guid organizationId, Guid tenantId, CancellationToken ct)
    {
        // Even in development, an ordinary user may only select a tenant to
        // which they have an active membership.
        if (await IsActivePlatformAdministrator(userId, ct))
        {
            if (!await db.Tenant.AnyAsync(x => x.Id == tenantId && x.OrganizationId == organizationId && x.IsActive && x.Organization.IsActive, ct))
                throw new InvalidOperationException("The selected tenant is inactive or does not belong to the selected organization.");
            return;
        }
        if (!await db.TenantUsers.AnyAsync(x => x.UserId == userId && x.TenantId == tenantId && x.Status == MembershipStatus.Active && x.Tenant.OrganizationId == organizationId && x.Tenant.IsActive && x.Tenant.Organization.IsActive, ct)) throw new UnauthorizedAccessException("The selected organization/tenant is not an active membership.");
    }
    private async Task RequireTenantAdministrator(Guid userId, Guid tenantId, CancellationToken ct)
    {
        if (BypassAuthorization || await IsActivePlatformAdministrator(userId, ct)) return;
        if (!await db.TenantUserRoles.AnyAsync(x => x.TenantUser.TenantId == tenantId && x.TenantUser.UserId == userId && x.TenantUser.Status == MembershipStatus.Active && x.TenantRole.TenantId == tenantId && x.TenantRole.Code == "TENANT_ADMINISTRATOR", ct))
            throw new UnauthorizedAccessException("Tenant administrator role is required.");
    }
    public async Task<IReadOnlyList<EntitlementDto>> GetEntitlementsAsync(Guid userId, Guid tenantId, CancellationToken ct)
    {
        if (BypassAuthorization)
            return await db.TenantModules.AsNoTracking()
                .Where(x => x.TenantId == tenantId && x.Module.IsActive && x.Module.Code != SystemResourceModuleCode)
                .OrderBy(x => x.Module.DisplayOrder)
                .ThenBy(x => x.Module.Name)
                .Select(x => new EntitlementDto(x.Id, x.ModuleId, x.Module.Code, x.Module.Name, x.Module.Description,
                    x.StartDate, x.EndDate, x.Status, true))
                .ToListAsync(ct);
        await ValidateMembership(userId, tenantId, ct); var now=DateTime.UtcNow;
        var rows=await db.TenantModules.AsNoTracking()
            .Where(x => x.TenantId==tenantId && x.Module.Code != SystemResourceModuleCode)
            .Include(x=>x.Module)
            .OrderBy(x=>x.Module.DisplayOrder)
            .ThenBy(x=>x.Module.Name)
            .ToListAsync(ct);
        return rows.Select(x=>new EntitlementDto(x.Id,x.ModuleId,x.Module.Code,x.Module.Name,x.Module.Description,x.StartDate,x.EndDate,x.Status,environment.IsDevelopment()||x.IsEffective(now))).ToList();
    }
    public async Task<IReadOnlyList<TenantOperationDto>> GetTenantOperationsAsync(Guid userId, Guid tenantId, CancellationToken ct)
    {
        if (!BypassAuthorization)
            await ValidateMembership(userId, tenantId, ct);
        return await db.TenantOperations.AsNoTracking()
            .Where(x => x.TenantModule.TenantId == tenantId && x.TenantModule.SubSystem.Code != SystemResourceModuleCode)
            .OrderBy(x => x.TenantModule.SubSystem.DisplayOrder).ThenBy(x => x.DisplayOrder)
            .Select(x => new TenantOperationDto(
                x.Id,
                x.Id,
                x.TenantModule.SubSystemId,
                x.TenantModuleId,
                x.TenantModule.Name,
                x.Name,
                x.IsActive))
            .ToListAsync(ct);
    }
    public async Task<TenantSubSystemNavigationDto?> GetTenantSubSystemNavigationAsync(Guid userId, Guid tenantId, Guid subSystemId, CancellationToken ct)
    {
        var entitlement = (await GetEntitlementsAsync(userId, tenantId, ct))
            .SingleOrDefault(x => x.ModuleId == subSystemId);
        if (entitlement is null) return null;

        var rows = await db.TenantOperations.AsNoTracking()
            .Where(x => x.TenantModule.TenantId == tenantId && x.TenantModule.SubSystemId == subSystemId)
            .OrderBy(x => x.DisplayOrder)
            .ToListAsync(ct);
        var tenantModules = await db.TenantNavigationModules.AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.SubSystemId == subSystemId)
            .OrderBy(x => x.DisplayOrder)
            .ToListAsync(ct);
        var modules = tenantModules.Select(module => new TenantSubSystemModuleDto(
                module.Id,
                module.Name,
                string.Empty,
                module.Filter,
                module.Icon,
                module.DisplayOrder,
                module.IsActive,
                rows.Where(operation => operation.TenantModuleId == module.Id)
                    .Select(operation => new TenantSubSystemOperationDto(
                        operation.Id,
                        operation.Name,
                        operation.Link,
                        operation.Filter,
                        operation.Icon,
                        operation.DisplayOrder,
                        operation.IsActive))
                    .ToList()))
            .ToList();

        return new TenantSubSystemNavigationDto(
            subSystemId,
            entitlement.ModuleCode,
            entitlement.ModuleName,
            entitlement.IsEffective,
            modules);
    }
    public async Task<IReadOnlyList<TenantSubSystemOperationDto>?> GetTenantModuleOperationsAsync(Guid userId, Guid tenantId, Guid moduleId, CancellationToken ct)
    {
        if (!BypassAuthorization)
            await ValidateMembership(userId, tenantId, ct);

        var tenantModuleId = await db.TenantNavigationModules.AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.Id == moduleId)
            .Select(x => (Guid?)x.Id)
            .SingleOrDefaultAsync(ct);
        if (!tenantModuleId.HasValue) return null;

        return await db.TenantOperations.AsNoTracking()
            .Where(x => x.TenantModule.TenantId == tenantId && x.TenantModuleId == tenantModuleId.Value)
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Name)
            .Select(x => new TenantSubSystemOperationDto(
                x.Id,
                x.Name,
                x.Link,
                x.Filter,
                x.Icon,
                x.DisplayOrder,
                x.IsActive))
            .ToListAsync(ct);
    }
    public async Task<PlatformOperationDto> SaveTenantNavigationModuleAsync(Guid userId, Guid tenantId, Guid subSystemId, Guid? id, PlatformOperationWriteDto dto, CancellationToken ct)
    {
        await RequireTenantAdministrator(userId, tenantId, ct);
        if (!await db.TenantModules.AnyAsync(x => x.TenantId == tenantId && x.ModuleId == subSystemId, ct))
            throw new InvalidOperationException("The sub system is not assigned to this tenant.");
        TenantNavigationModule entity;
        if (id.HasValue)
        {
            entity = await db.TenantNavigationModules.SingleAsync(x => x.Id == id && x.TenantId == tenantId && x.SubSystemId == subSystemId, ct);
            entity.Update(dto.Name, dto.Filter, dto.Icon, dto.DisplayOrder, dto.IsActive);
        }
        else
        {
            var next = (await db.TenantNavigationModules.Where(x => x.TenantId == tenantId && x.SubSystemId == subSystemId).Select(x => x.DisplayOrder).ToListAsync(ct)).DefaultIfEmpty(0).Max() + 1;
            entity = TenantNavigationModule.Create(tenantId, subSystemId, dto.Name, dto.Filter, dto.Icon, next, dto.IsActive);
            db.TenantNavigationModules.Add(entity);
        }
        await db.SaveChangesAsync(ct);
        return new(entity.Id, subSystemId, null, entity.Name, string.Empty, entity.Filter, entity.Icon, entity.DisplayOrder, entity.IsActive);
    }
    public async Task DeleteTenantNavigationModuleAsync(Guid userId, Guid tenantId, Guid subSystemId, Guid id, CancellationToken ct)
    {
        await RequireTenantAdministrator(userId, tenantId, ct);
        var entity = await db.TenantNavigationModules.SingleOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId && x.SubSystemId == subSystemId, ct)
            ?? throw new InvalidOperationException("Module does not exist.");
        if (await db.TenantOperations.AnyAsync(x => x.TenantModule.TenantId == tenantId && x.TenantModuleId == id, ct))
            throw new InvalidOperationException("Delete the module's operations first.");
        db.TenantNavigationModules.Remove(entity);
        await db.SaveChangesAsync(ct);
    }

    public async Task<PlatformOperationDto> CreateTenantOperationAsync(Guid userId, Guid tenantId, Guid subSystemId, Guid tenantModuleId, PlatformOperationWriteDto dto, CancellationToken ct)
    {
        await RequireTenantAdministrator(userId, tenantId, ct);
        if (!await db.TenantNavigationModules.AnyAsync(x => x.Id == tenantModuleId && x.TenantId == tenantId && x.SubSystemId == subSystemId, ct))
            throw new InvalidOperationException("The selected module is not assigned to this tenant and sub system.");
        var displayOrder = (await db.TenantOperations.Where(x => x.TenantModuleId == tenantModuleId)
            .Select(x => x.DisplayOrder).ToListAsync(ct)).DefaultIfEmpty(0).Max() + 1;
        var operation = TenantOperation.Create(tenantModuleId, dto.Name, dto.Link, dto.Filter, dto.Icon, displayOrder, dto.IsActive);
        db.TenantOperations.Add(operation);
        await db.SaveChangesAsync(ct);
        return new(operation.Id, subSystemId, tenantModuleId, operation.Name, operation.Link, operation.Filter, operation.Icon, operation.DisplayOrder, operation.IsActive);
    }

    public async Task DeleteTenantOperationAsync(Guid userId, Guid tenantId, Guid operationId, CancellationToken ct)
    {
        await RequireTenantAdministrator(userId, tenantId, ct);
        var operation = await db.TenantOperations.SingleOrDefaultAsync(
            x => x.Id == operationId && x.TenantModule.TenantId == tenantId, ct)
            ?? throw new InvalidOperationException("Operation does not exist.");
        if (await db.TenantRolePermissions.AnyAsync(x => x.TenantOperationId == operationId, ct))
            throw new InvalidOperationException("The operation cannot be deleted while it is assigned to a role.");
        db.TenantOperations.Remove(operation);
        await db.SaveChangesAsync(ct);
    }
    public async Task<TenantOperationDto> SetTenantOperationActiveAsync(Guid userId, Guid tenantId, Guid operationId, bool isActive, CancellationToken ct)
    {
        await RequireTenantAdministrator(userId, tenantId, ct);

        // Edit requests identify the tenant operation itself, while assignment requests
        // identify the source platform operation. Support both without confusing the IDs.
        var existingAssignment = await db.TenantOperations
            .SingleOrDefaultAsync(x => x.Id == operationId && x.TenantModule.TenantId == tenantId, ct);
        if (existingAssignment is not null)
        {
            existingAssignment.SetActive(isActive);
            await db.SaveChangesAsync(ct);

            var tenantModule = await db.TenantNavigationModules.AsNoTracking()
                .Where(x => x.Id == existingAssignment.TenantModuleId && x.TenantId == tenantId)
                .Select(x => new { x.Name, x.SubSystemId })
                .SingleAsync(ct);

            return new(existingAssignment.Id, existingAssignment.Id, tenantModule.SubSystemId,
                existingAssignment.TenantModuleId, tenantModule.Name, existingAssignment.Name,
                existingAssignment.IsActive);
        }

        var operation = await db.Operation.AsNoTracking().SingleOrDefaultAsync(x => x.Id == operationId, ct)
            ?? throw new InvalidOperationException("Operation does not exist.");
        if (!await db.TenantModules.AnyAsync(x => x.TenantId == tenantId && x.ModuleId == operation.Module.SubSystemId, ct))
            throw new InvalidOperationException("The operation's module is not assigned to this tenant.");
        var tenantModuleId = await db.TenantNavigationModules.Where(x => x.TenantId == tenantId && x.SubSystemId == operation.Module.SubSystemId && x.Name == operation.Module.Name).Select(x => (Guid?)x.Id).SingleOrDefaultAsync(ct);
        if (!tenantModuleId.HasValue) throw new InvalidOperationException("The operation's module is not assigned to this tenant.");
        var assignment = await db.TenantOperations.SingleOrDefaultAsync(x => x.TenantModule.TenantId == tenantId && x.TenantModuleId == tenantModuleId && x.Name == operation.Name && x.Link == operation.Link, ct);
        if (assignment is null)
        {
            assignment = TenantOperation.Copy(tenantId, operation, tenantModuleId);
            db.TenantOperations.Add(assignment);
        }
        assignment.SetActive(isActive);
        await db.SaveChangesAsync(ct);
        var parentOperationName = await db.TenantNavigationModules.AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.Id == assignment.TenantModuleId)
            .Select(x => x.Name)
            .FirstOrDefaultAsync(ct);
        return new(assignment.Id, operation.Id, operation.Module.SubSystemId, assignment.TenantModuleId, parentOperationName, operation.Name, assignment.IsActive);
    }
    public async Task<IReadOnlyList<TenantRoleDto>> GetRolesAsync(Guid userId, Guid tenantId, CancellationToken ct)
    {
        await ValidateMembership(userId,tenantId,ct);
        return await db.TenantRoles.AsNoTracking().Where(x=>x.TenantId==tenantId &&
                (!x.RoleId.HasValue || !db.StandardRoleTemplates.Any(t=>t.Id==x.RoleId && t.IsPlatformRole)))
            .Select(x=>new TenantRoleDto(x.Id,x.Code,x.Name,x.Description ?? db.StandardRoleTemplates.Where(t=>t.Id==x.RoleId).Select(t=>t.Description).FirstOrDefault(),x.RoleId,x.IsCustomized,db.TenantUserRoles.Count(a=>a.TenantRoleId==x.Id),
                x.Permissions.Select(p=>new TenantRolePermissionDto(p.TenantOperationId,p.CanView,p.CanAdd,p.CanEdit,p.CanDelete,p.CanApprove,p.CanExport)).ToList()))
            .ToListAsync(ct);
    }
    public async Task<TenantRoleDto> SaveRoleAsync(Guid userId, Guid tenantId, Guid? id, TenantRoleWriteDto dto, CancellationToken ct)
    {
        await RequireTenantAdministrator(userId,tenantId,ct); TenantRole role;
        if(id.HasValue){role=await db.TenantRoles.Include(x=>x.Permissions).SingleAsync(x=>x.Id==id&&x.TenantId==tenantId,ct); role.MarkCustomized(); db.TenantRolePermissions.RemoveRange(role.Permissions);}
        else {role=TenantRole.Create(tenantId,dto.Code,dto.Name,dto.RoleId);db.TenantRoles.Add(role);}
        var permissions=dto.Permissions?.GroupBy(x=>x.TenantOperationId).Select(x=>x.Last()).ToList()??[];
        var tenantOperationIds=permissions.Select(x=>x.TenantOperationId).ToList(); if(await db.TenantOperations.CountAsync(x=>x.TenantModule.TenantId==tenantId&&x.IsActive&&tenantOperationIds.Contains(x.Id),ct)!=tenantOperationIds.Count) throw new InvalidOperationException("One or more operations are not assigned to this tenant.");
        foreach(var permission in permissions) db.TenantRolePermissions.Add(TenantRolePermission.Create(role.Id,permission.TenantOperationId,permission.CanAdd,permission.CanEdit,permission.CanDelete,permission.CanApprove,permission.CanView,permission.CanExport)); await db.SaveChangesAsync(ct);
        return new(role.Id,role.Code,role.Name,role.Description,role.RoleId,role.IsCustomized,await db.TenantUserRoles.CountAsync(x=>x.TenantRoleId==role.Id,ct),permissions);
    }
    public async Task<IReadOnlyList<TenantUserDto>> GetTenantUsersAsync(Guid userId, Guid tenantId, CancellationToken ct) { await RequireTenantAdministrator(userId,tenantId,ct); return await db.TenantUsers.AsNoTracking().Where(x=>x.TenantId==tenantId).Select(x=>new TenantUserDto(x.Id,x.UserId,x.User.FullName,x.User.UserName,x.User.Email,x.Status.ToString(),x.IsDefaultTenant,x.User.ProfilePicture==null?null:$"/api/v1.0/User/{x.UserId}/profile-picture",x.RoleAssignments.Where(r=>r.TenantRole.RoleId.HasValue&&r.TenantRole.Code!="ADMINISTRATOR"&&r.TenantRole.Name!="Administrator").Select(r=>r.TenantRole.RoleId!.Value).ToList())).ToListAsync(ct); }
    public async Task<TenantUserDto> SaveTenantUserAsync(Guid userId, Guid tenantId, TenantUserWriteDto dto, CancellationToken ct)
    {
        await RequireTenantAdministrator(userId,tenantId,ct); if(!await db.User.AnyAsync(x=>x.Id==dto.UserId,ct)) throw new InvalidOperationException("Global user does not exist.");
        var membership=await db.TenantUsers.Include(x=>x.RoleAssignments).SingleOrDefaultAsync(x=>x.TenantId==tenantId&&x.UserId==dto.UserId,ct)??TenantUser.Create(tenantId,dto.UserId,dto.IsDefaultTenant); if(db.Entry(membership).State==EntityState.Detached) db.TenantUsers.Add(membership);
        membership.UpdateMembership(dto.IsDefaultTenant,dto.IsActive??true);
        if(dto.IsDefaultTenant)
        {
            var otherDefaults=await db.TenantUsers.Where(x=>x.UserId==dto.UserId&&x.Id!=membership.Id&&x.IsDefaultTenant).ToListAsync(ct);
            foreach(var other in otherDefaults) other.UpdateMembership(false,other.Status==MembershipStatus.Active);
        }
        var standardRoleIds=dto.StandardRoleIds?.Distinct().ToList()??[];
        var templates=await db.StandardRoleTemplates.Where(x=>x.IsActive&&!x.IsPlatformRole&&standardRoleIds.Contains(x.Id)).ToListAsync(ct);
        if(templates.Count!=standardRoleIds.Count) throw new InvalidOperationException("One or more standard roles do not exist, are inactive, or are platform roles.");
        var tenantRoles=await db.TenantRoles.Where(x=>x.TenantId==tenantId&&x.RoleId.HasValue&&standardRoleIds.Contains(x.RoleId.Value)).ToListAsync(ct);
        var assignedOperationIds=await db.TenantOperations.AsNoTracking().Where(x=>x.TenantModule.TenantId==tenantId&&x.IsActive).Select(x=>x.Id).ToListAsync(ct);
        var assignedOperationSet=assignedOperationIds.ToHashSet();
        foreach(var template in templates.Where(t=>tenantRoles.All(r=>r.RoleId!=t.Id)))
        {
            var tenantRole=await db.TenantRoles.SingleOrDefaultAsync(x=>x.TenantId==tenantId&&x.Code==template.Code,ct);
            if(tenantRole is null)
            {
                tenantRole=TenantRole.Create(tenantId,template.Code,template.Name,template.Id);
                db.TenantRoles.Add(tenantRole);
            }
            else
            {
                tenantRole.LinkToStandardRole(template.Id);
            }
            tenantRoles.Add(tenantRole);
        }
        db.TenantUserRoles.RemoveRange(membership.RoleAssignments);
        foreach(var tenantRole in tenantRoles) db.TenantUserRoles.Add(TenantUserRole.Create(membership.Id,tenantRole.Id,userId));
        await db.SaveChangesAsync(ct);
        var user=await db.User.AsNoTracking().SingleAsync(x=>x.Id==dto.UserId,ct); return new(membership.Id,user.Id,user.FullName,user.UserName,user.Email,membership.Status.ToString(),membership.IsDefaultTenant,user.ProfilePicture==null?null:$"/api/v1.0/User/{user.Id}/profile-picture",standardRoleIds);
    }
    public async Task RemoveTenantUserAsync(Guid userId, Guid tenantId, Guid membershipId, CancellationToken ct)
    {
        await RequireTenantAdministrator(userId,tenantId,ct);
        var membership=await db.TenantUsers.SingleOrDefaultAsync(x=>x.Id==membershipId&&x.TenantId==tenantId,ct)
            ?? throw new KeyNotFoundException("Tenant user membership does not exist.");
        if(membership.UserId==userId&&!await IsActivePlatformAdministrator(userId,ct)) throw new InvalidOperationException("You cannot remove your own tenant membership.");
        db.TenantUsers.Remove(membership);
        await db.SaveChangesAsync(ct);
    }
    public async Task CreateSubscriptionAsync(SubscriptionWriteDto dto, CancellationToken ct)
    {
        if(!await db.Organizations.AnyAsync(x=>x.Id==dto.OrganizationId,ct)||!await db.SubscriptionPlan.AnyAsync(x=>x.Id==dto.PlanId,ct)) throw new InvalidOperationException("Organization or plan not found.");
        var tenants=await db.Tenant.Where(x=>x.OrganizationId==dto.OrganizationId&&dto.TenantIds.Contains(x.Id)).ToListAsync(ct); if(tenants.Count!=dto.TenantIds.Distinct().Count()) throw new InvalidOperationException("Tenant ownership validation failed.");
        var sub=OrganizationSubscription.Create(dto.OrganizationId,dto.PlanId,dto.StartDate,dto.EndDate,dto.Currency,dto.AutoRenew);
        db.OrganizationSubscriptions.Add(sub);
        var modules=await db.SubscriptionPlanModules.Where(x=>x.SubscriptionPlanId==dto.PlanId).ToListAsync(ct);
        var moduleIds=modules.Select(x=>x.ModuleId).Distinct().ToList();
        var platformOperations=await db.Operation.AsNoTracking().Where(x=>moduleIds.Contains(x.Module.SubSystemId)).ToListAsync(ct);
        var platformNavigationModules=await db.NavigationModules.AsNoTracking().Where(x=>moduleIds.Contains(x.SubSystemId)).ToListAsync(ct);
        foreach(var tenant in tenants)
        {
            foreach(var module in modules)
                db.TenantModules.Add(TenantModule.Create(dto.OrganizationId,tenant.Id,module.ModuleId,dto.StartDate,dto.EndDate,EntitlementSourceType.Plan,sub.Id));
            var tenantNavigationModules=await db.TenantNavigationModules.Where(x=>x.TenantId==tenant.Id&&moduleIds.Contains(x.SubSystemId)).ToListAsync(ct);
            foreach(var source in platformNavigationModules.Where(source=>tenantNavigationModules.All(candidate=>candidate.SubSystemId!=source.SubSystemId||candidate.Name!=source.Name)))
            {
                var copy=TenantNavigationModule.Copy(tenant.Id,source);
                db.TenantNavigationModules.Add(copy);
                tenantNavigationModules.Add(copy);
            }
            var navigationMap=platformNavigationModules.ToDictionary(source=>source.Id,source=>tenantNavigationModules.Single(candidate=>candidate.SubSystemId==source.SubSystemId&&candidate.Name==source.Name).Id);
            var existingOperationKeys=(await db.TenantOperations.Where(x=>x.TenantModule.TenantId==tenant.Id).Select(x=>new{x.TenantModuleId,x.Name,x.Link}).ToListAsync(ct)).Select(x=>(x.TenantModuleId,x.Name,x.Link)).ToHashSet();
            foreach (var local in db.TenantOperations.Local)
                existingOperationKeys.Add((local.TenantModuleId, local.Name, local.Link));
            foreach(var operation in platformOperations)
            {
                if (!navigationMap.TryGetValue(operation.ModuleId, out var tenantModuleId)) continue;
                if (!existingOperationKeys.Add((tenantModuleId, operation.Name, operation.Link))) continue;
                db.TenantOperations.Add(TenantOperation.Copy(tenant.Id,operation,tenantModuleId));
            }
        }
        await db.SaveChangesAsync(ct);
    }
    public async Task<bool> AuthorizeAsync(Guid userId, Guid tenantId, string operationCode, string action, CancellationToken ct)
    {
        if (BypassAuthorization || await IsActivePlatformAdministrator(userId, ct)) return true;
        var parts = operationCode.Split('.', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 3) return false;
        var operationLink = $"/api/{parts[^2].ToLowerInvariant()}";
        var actionPrefix = $"{parts[^1]} ";
        var operationIds = await db.Operation.AsNoTracking()
            .Where(x => x.IsActive && x.Link == operationLink && x.Name.StartsWith(actionPrefix))
            .Select(x => x.Id)
            .Take(2)
            .ToListAsync(ct);
        if (operationIds.Count != 1) return false;
        var operationId = operationIds[0];
        var now=DateTime.UtcNow;var development=environment.IsDevelopment(); return await db.TenantUserRoles.AsNoTracking().AnyAsync(a=>a.TenantUser.UserId==userId&&a.TenantUser.TenantId==tenantId&&a.TenantUser.Status==MembershipStatus.Active&&a.TenantRole.TenantId==tenantId&&a.TenantRole.Permissions.Any(p=>p.TenantOperation.TenantModule.TenantId==tenantId&&p.TenantOperation.Id==operationId&&p.TenantOperation.IsActive&&((action=="view"&&p.CanView)||(action=="add"&&p.CanAdd)||(action=="edit"&&p.CanEdit)||(action=="delete"&&p.CanDelete)||(action=="approve"&&p.CanApprove))&&db.TenantModules.Any(e=>e.TenantId==tenantId&&e.ModuleId==p.TenantOperation.TenantModule.SubSystemId&&(development||(e.Status&&e.StartDate<=now&&(!e.EndDate.HasValue||e.EndDate>=now)&&(!e.TrialEndDate.HasValue||e.TrialEndDate>=now))))),ct);
    }
    private async Task ValidateMembership(Guid userId,Guid tenantId,CancellationToken ct)
    {
        if(BypassAuthorization || await IsActivePlatformAdministrator(userId, ct))return;
        if(!await db.TenantUsers.AnyAsync(x=>x.UserId==userId&&x.TenantId==tenantId&&x.Status==MembershipStatus.Active&&x.Tenant.IsActive,ct))
            throw new UnauthorizedAccessException("Active tenant membership is required.");
    }

    private Task<bool> IsActivePlatformAdministrator(Guid userId, CancellationToken ct) =>
        db.User.AsNoTracking().AnyAsync(
            x => x.Id == userId && x.IsPlatformAdministrator && x.AccountStatus,
            ct);
}
