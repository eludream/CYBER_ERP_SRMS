namespace CyberErp.Srms.App.Common.Services;

public record OrganizationDto(Guid Id, string Code, string LegalName, string DisplayName, string Currency, string Timezone, string Locale, string DateFormat, bool IsActive,
    string? LogoUrl, string? Address, string? PhoneNumber, string? Email, string? RegistrationNumber, string? TaxNumber, string? OrganizationType, string? Industry,
    string? Website, string? PostalAddress, string? Country, string? Region, string? City, string? PostalCode, string? PrimaryContactName, string? PrimaryContactTitle,
    string? PrimaryContactEmail, string? PrimaryContactPhone, int FiscalYearStartMonth, string DefaultLanguage, string? DataRetentionPolicy, string? RegulatoryIdentifiers, string? TINNumber);
public record OrganizationWriteDto(string Code, string LegalName, string DisplayName, string Currency, string Timezone, string Locale, string DateFormat,
    string? Address = null, string? PhoneNumber = null, string? Email = null, bool IsActive = true, string? RegistrationNumber = null,
    string? TaxNumber = null, string? OrganizationType = null, string? Industry = null, string? Website = null, string? PostalAddress = null, string? Country = null,
    string? Region = null, string? City = null, string? PostalCode = null, string? PrimaryContactName = null, string? PrimaryContactTitle = null,
    string? PrimaryContactEmail = null, string? PrimaryContactPhone = null, int FiscalYearStartMonth = 1, string DefaultLanguage = "en",
    string? DataRetentionPolicy = null, string? RegulatoryIdentifiers = null, string? TINNumber = null);
public record TenantSummaryDto(Guid Id, Guid OrganizationId, string Identifier, string Name, bool IsActive, Guid? TenantTypeId = null, string? TenantTypeName = null);
public record TenantWriteDto(Guid OrganizationId, string Identifier, string Name, string? TimezoneOverride = null, string? LocaleOverride = null, string? CurrencyOverride = null, bool IsActive = true, Guid? TenantTypeId = null);
public record PlatformModuleDto(Guid Id, string Code, string Name, string Description, string LandingPath, string? Icon, int DisplayOrder, bool IsActive, string Abbreviation);
public record PlatformModuleWriteDto(string Code, string Name, string Description, string LandingPath, string? Icon, int DisplayOrder, bool IsActive = true, string SubSystem = "ERP", string Abbreviation = "");
public record PlatformOperationDto(Guid Id, Guid ModuleId, Guid? ParentOperationId, string Name, string Link, string Filter, string Icon, int DisplayOrder, bool IsActive);
public record PlatformOperationWriteDto(string Name, string Link, string Filter, string Icon, Guid? ParentOperationId, int DisplayOrder, bool IsActive = true);
public record MembershipDto(Guid OrganizationId, string OrganizationName, Guid TenantId, string TenantName, bool IsOrganizationAdministrator, bool IsDefaultTenant, bool IsActive);
public record EntitlementDto(Guid Id, Guid ModuleId, string ModuleCode, string ModuleName, string ModuleDescription, DateTime StartDate, DateTime? EndDate, bool Status, bool IsEffective);
public record TenantOperationDto(Guid Id, Guid OperationId, Guid ModuleId, Guid? ParentOperationId, string? ParentOperationName, string Name, bool IsActive);
public record TenantSubSystemOperationDto(Guid Id, string Name, string Link, string Filter, string Icon, int DisplayOrder, bool IsActive);
public record TenantSubSystemModuleDto(Guid Id, string Name, string Link, string Filter, string Icon, int DisplayOrder, bool IsActive, IReadOnlyList<TenantSubSystemOperationDto> Operations);
public record TenantSubSystemNavigationDto(Guid SubSystemId, string Code, string Name, bool IsEffective, IReadOnlyList<TenantSubSystemModuleDto> Modules);
public record TenantRolePermissionDto(Guid TenantOperationId, bool CanView, bool CanAdd, bool CanEdit, bool CanDelete, bool CanApprove, bool CanExport);
public record TenantRoleDto(Guid Id, string Code, string Name, string? Description, Guid? RoleId, bool IsCustomized, int UserCount, IReadOnlyList<TenantRolePermissionDto> Permissions);
public record TenantRoleWriteDto(string Code, string Name, Guid? RoleId, IReadOnlyList<TenantRolePermissionDto>? Permissions);
public record TenantUserDto(Guid MembershipId, Guid UserId, string FullName, string UserName, string Email, string Status, bool IsDefaultTenant, string? ProfilePictureUrl, IReadOnlyList<Guid> StandardRoleIds);
public record TenantUserWriteDto(Guid UserId, bool IsDefaultTenant, IReadOnlyList<Guid>? StandardRoleIds, bool? IsActive = null);
public record SubscriptionWriteDto(Guid OrganizationId, Guid PlanId, DateTime StartDate, DateTime? EndDate, string Currency, bool AutoRenew, IReadOnlyList<Guid> TenantIds);
public record OrganizationOnboardingDto(OrganizationWriteDto Organization, Guid AdministratorUserId, Guid? PlanId, DateTime? SubscriptionStartDate, DateTime? SubscriptionEndDate);
public record TenantOnboardingDto(TenantWriteDto Tenant, Guid AdministratorUserId, IReadOnlyList<Guid> ModuleIds, Guid? AdministratorTemplateId);

public interface IMultiTenantControlPlaneService
{
    Task EnsurePlatformAdministratorAsync(Guid userId, CancellationToken ct);
    Task<IReadOnlyList<OrganizationDto>> GetOrganizationsAsync(CancellationToken ct);
    Task<OrganizationDto> SaveOrganizationAsync(Guid? id, OrganizationWriteDto dto, CancellationToken ct);
    Task<TenantSummaryDto> SaveTenantAsync(Guid? id, TenantWriteDto dto, CancellationToken ct);
    Task<OrganizationDto> OnboardOrganizationAsync(OrganizationOnboardingDto dto, CancellationToken ct);
    Task<TenantSummaryDto> OnboardTenantAsync(TenantOnboardingDto dto, CancellationToken ct);
    Task<IReadOnlyList<PlatformModuleDto>> GetModulesAsync(CancellationToken ct);
    Task<PlatformModuleDto> SaveModuleAsync(Guid? id, PlatformModuleWriteDto dto, CancellationToken ct);
    Task<IReadOnlyList<PlatformOperationDto>> GetOperationsAsync(Guid moduleId, CancellationToken ct);
    Task<PlatformOperationDto> SaveOperationAsync(Guid moduleId, Guid? id, PlatformOperationWriteDto dto, CancellationToken ct);
    Task<IReadOnlyList<MembershipDto>> GetMembershipsAsync(Guid userId, CancellationToken ct);
    Task ValidateSelectionAsync(Guid userId, Guid organizationId, Guid tenantId, CancellationToken ct);
    Task<IReadOnlyList<EntitlementDto>> GetEntitlementsAsync(Guid userId, Guid tenantId, CancellationToken ct);
    Task<IReadOnlyList<TenantOperationDto>> GetTenantOperationsAsync(Guid userId, Guid tenantId, CancellationToken ct);
    Task<TenantSubSystemNavigationDto?> GetTenantSubSystemNavigationAsync(Guid userId, Guid tenantId, Guid subSystemId, CancellationToken ct);
    Task<IReadOnlyList<TenantSubSystemOperationDto>?> GetTenantModuleOperationsAsync(Guid userId, Guid tenantId, Guid moduleId, CancellationToken ct);
    Task<PlatformOperationDto> SaveTenantNavigationModuleAsync(Guid userId, Guid tenantId, Guid subSystemId, Guid? id, PlatformOperationWriteDto dto, CancellationToken ct);
    Task<PlatformOperationDto> CreateTenantOperationAsync(Guid userId, Guid tenantId, Guid subSystemId, Guid tenantModuleId, PlatformOperationWriteDto dto, CancellationToken ct);
    Task DeleteTenantOperationAsync(Guid userId, Guid tenantId, Guid operationId, CancellationToken ct);
    Task DeleteTenantNavigationModuleAsync(Guid userId, Guid tenantId, Guid subSystemId, Guid id, CancellationToken ct);
    Task<TenantOperationDto> SetTenantOperationActiveAsync(Guid userId, Guid tenantId, Guid operationId, bool isActive, CancellationToken ct);
    Task<IReadOnlyList<TenantRoleDto>> GetRolesAsync(Guid userId, Guid tenantId, CancellationToken ct);
    Task<TenantRoleDto> SaveRoleAsync(Guid userId, Guid tenantId, Guid? id, TenantRoleWriteDto dto, CancellationToken ct);
    Task<IReadOnlyList<TenantUserDto>> GetTenantUsersAsync(Guid userId, Guid tenantId, CancellationToken ct);
    Task<TenantUserDto> SaveTenantUserAsync(Guid userId, Guid tenantId, TenantUserWriteDto dto, CancellationToken ct);
    Task RemoveTenantUserAsync(Guid userId, Guid tenantId, Guid membershipId, CancellationToken ct);
    Task CreateSubscriptionAsync(SubscriptionWriteDto dto, CancellationToken ct);
    Task<bool> AuthorizeAsync(Guid userId, Guid tenantId, string operationCode, string action, CancellationToken ct);
}
