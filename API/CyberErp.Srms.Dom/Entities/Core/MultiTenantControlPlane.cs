using NodaTime;

namespace CyberErp.Srms.Dom.Entities.Core;

public abstract class ControlPlaneEntity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public Instant CreatedAt { get; protected set; } = SystemClock.Instance.GetCurrentInstant();
    public Instant? UpdatedAt { get; protected set; }
    public string? CreatedBy { get; protected set; }
    public string? UpdatedBy { get; protected set; }
    public byte[] RowVersion { get; protected set; } = BitConverter.GetBytes(DateTime.UtcNow.Ticks);

    protected void Touch(string? actor = null)
    {
        UpdatedAt = SystemClock.Instance.GetCurrentInstant();
        UpdatedBy = actor;
        RowVersion = BitConverter.GetBytes(DateTime.UtcNow.Ticks);
    }
}

public enum MembershipStatus { Pending, Active, Suspended, Revoked }
public enum SubscriptionStatus { Pending, Trial, Active, Suspended, Expired, Cancelled }
public enum EntitlementSourceType { BasePlan, Plan, AddOn, Trial, Migration }
public enum BillingCycle { Monthly, Quarterly, Annual, Custom }

public sealed class Organization : ControlPlaneEntity
{
    public string Code { get; private set; } = string.Empty;
    public string LegalName { get; private set; } = string.Empty;
    public string DisplayName { get; private set; } = string.Empty;
    public byte[]? Logo { get; private set; }
    public string? LogoContentType { get; private set; }
    public string? Address { get; private set; }
    public string? PhoneNumber { get; private set; }
    public string? Email { get; private set; }
    public string? RegistrationNumber { get; private set; }
    public string? TaxNumber { get; private set; }
    public string? TINNumber { get; private set; }
    public string? OrganizationType { get; private set; }
    public string? Industry { get; private set; }
    public string? Website { get; private set; }
    public string? PostalAddress { get; private set; }
    public string? Country { get; private set; }
    public string? Region { get; private set; }
    public string? City { get; private set; }
    public string? PostalCode { get; private set; }
    public string? PrimaryContactName { get; private set; }
    public string? PrimaryContactTitle { get; private set; }
    public string? PrimaryContactEmail { get; private set; }
    public string? PrimaryContactPhone { get; private set; }
    public int FiscalYearStartMonth { get; private set; } = 1;
    public string DefaultLanguage { get; private set; } = "en";
    public string? DataRetentionPolicy { get; private set; }
    public string? RegulatoryIdentifiers { get; private set; }
    public string Currency { get; private set; } = "USD";
    public string Timezone { get; private set; } = "UTC";
    public string Locale { get; private set; } = "en";
    public string DateFormat { get; private set; } = "yyyy-MM-dd";
    public bool IsActive { get; private set; } = true;
    public ICollection<Tenant> Tenants { get; } = new List<Tenant>();

    private Organization() { }
    public static Organization Create(string code, string legalName, string displayName, string currency, string timezone, string locale, string dateFormat)
    {
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(legalName) || string.IsNullOrWhiteSpace(displayName))
            throw new ArgumentException("Organization code and names are required.");
        if (currency.Trim().Length != 3) throw new ArgumentException("Currency must be an ISO 4217 code.", nameof(currency));
        return new Organization { Code = code.Trim().ToUpperInvariant(), LegalName = legalName.Trim(), DisplayName = displayName.Trim(), Currency = currency.Trim().ToUpperInvariant(), Timezone = timezone.Trim(), Locale = locale.Trim(), DateFormat = dateFormat.Trim() };
    }
    public void Update(string code, string legalName, string displayName, string? address, string? phone, string? email, string currency, string timezone, string locale, string dateFormat, bool isActive,
        string? registrationNumber = null, string? taxNumber = null, string? tinNumber = null, string? organizationType = null, string? industry = null, string? website = null, string? postalAddress = null,
        string? country = null, string? region = null, string? city = null, string? postalCode = null, string? primaryContactName = null, string? primaryContactTitle = null,
        string? primaryContactEmail = null, string? primaryContactPhone = null, int fiscalYearStartMonth = 1, string defaultLanguage = "en", string? dataRetentionPolicy = null, string? regulatoryIdentifiers = null)
    {
        if (string.IsNullOrWhiteSpace(code)) throw new ArgumentException("Organization code is required.", nameof(code));
        Code = code.Trim().ToUpperInvariant(); LegalName = legalName.Trim(); DisplayName = displayName.Trim(); Address = address; PhoneNumber = phone; Email = email;
        Currency = currency.Trim().ToUpperInvariant(); Timezone = timezone.Trim(); Locale = locale.Trim(); DateFormat = dateFormat.Trim(); IsActive = isActive; Touch();
        RegistrationNumber = registrationNumber; TaxNumber = taxNumber; TINNumber = tinNumber; OrganizationType = organizationType; Industry = industry; Website = website; PostalAddress = postalAddress;
        Country = country; Region = region; City = city; PostalCode = postalCode; PrimaryContactName = primaryContactName; PrimaryContactTitle = primaryContactTitle;
        PrimaryContactEmail = primaryContactEmail; PrimaryContactPhone = primaryContactPhone; FiscalYearStartMonth = fiscalYearStartMonth is >= 1 and <= 12 ? fiscalYearStartMonth : throw new ArgumentOutOfRangeException(nameof(fiscalYearStartMonth));
        DefaultLanguage = string.IsNullOrWhiteSpace(defaultLanguage) ? "en" : defaultLanguage.Trim(); DataRetentionPolicy = dataRetentionPolicy; RegulatoryIdentifiers = regulatoryIdentifiers;
    }
    public void SetLogo(byte[] logo, string contentType)
    {
        if (logo.Length == 0) throw new ArgumentException("Logo image data is required.", nameof(logo));
        Logo = logo; LogoContentType = contentType; Touch();
    }
    public void ClearLogo() { Logo = null; LogoContentType = null; Touch(); }
}

public sealed class TenantUser : ControlPlaneEntity
{
    public Guid TenantId { get; private set; }
    public Guid UserId { get; private set; }
    public MembershipStatus Status { get; private set; } = MembershipStatus.Active;
    public bool IsDefaultTenant { get; private set; }
    public Tenant Tenant { get; private set; } = null!;
    public User User { get; private set; } = null!;
    public ICollection<TenantUserRole> RoleAssignments { get; } = new List<TenantUserRole>();
    private TenantUser() { }
    public static TenantUser Create(Guid tenantId, Guid userId, bool isDefault = false) =>
        tenantId == Guid.Empty || userId == Guid.Empty ? throw new ArgumentException("Tenant and user are required.") : new() { TenantId = tenantId, UserId = userId, IsDefaultTenant = isDefault };
    public void UpdateMembership(bool isDefault, bool isActive)
    {
        IsDefaultTenant = isDefault;
        Status = isActive ? MembershipStatus.Active : MembershipStatus.Suspended;
        Touch();
    }
}

public sealed class SubscriptionPlanModule : ControlPlaneEntity
{
    public Guid SubscriptionPlanId { get; private set; }
    public Guid ModuleId { get; private set; }
    public SubscriptionPlan SubscriptionPlan { get; private set; } = null!;
    public Module Module { get; private set; } = null!;
    private SubscriptionPlanModule() { }
    public static SubscriptionPlanModule Create(Guid planId, Guid moduleId) => new() { SubscriptionPlanId = planId, ModuleId = moduleId };
}

public sealed class StandardRoleTemplate : ControlPlaneEntity
{
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;
    public bool IsPlatformRole { get; private set; }
    private StandardRoleTemplate() { }
    public static StandardRoleTemplate Create(string code, string name, string description, bool isPlatformRole = false, bool isActive = true) => new() { Code = code.Trim().ToUpperInvariant(), Name = name.Trim(), Description = description.Trim(), IsPlatformRole = isPlatformRole, IsActive = isActive };
    public void Update(string name, string description, bool isActive = true, bool? isPlatformRole = null) { Name = name.Trim(); Description = description.Trim(); IsActive = isActive; if (isPlatformRole.HasValue) IsPlatformRole = isPlatformRole.Value; }
}

public sealed class OrganizationSubscription : ControlPlaneEntity
{
    public Guid OrganizationId { get; private set; }
    public Guid SubscriptionPlanId { get; private set; }
    public SubscriptionStatus Status { get; private set; }
    public string Currency { get; private set; } = "USD";
    public DateTime StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }
    public DateTime? NextBillingDate { get; private set; }
    public bool AutoRenew { get; private set; }
    public Organization Organization { get; private set; } = null!;
    public SubscriptionPlan SubscriptionPlan { get; private set; } = null!;
    private OrganizationSubscription() { }
    public static OrganizationSubscription Create(Guid organizationId, Guid planId, DateTime start, DateTime? end, string currency, bool autoRenew) => new() { OrganizationId = organizationId, SubscriptionPlanId = planId, StartDate = start, EndDate = end, Currency = currency.Trim().ToUpperInvariant(), AutoRenew = autoRenew, Status = start > DateTime.UtcNow ? SubscriptionStatus.Pending : SubscriptionStatus.Active };
}

public sealed class TenantModule : ControlPlaneEntity
{
    public Guid OrganizationId { get; private set; }
    public Guid? OrganizationSubscriptionId { get; private set; }
    public Guid TenantId { get; private set; }
    public Guid ModuleId { get; private set; }
    public EntitlementSourceType SourceType { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }
    public DateTime? TrialEndDate { get; private set; }
    public bool Status { get; private set; } = true;
    public Tenant Tenant { get; private set; } = null!;
    public Module Module { get; private set; } = null!;
    private TenantModule() { }
    public static TenantModule Create(Guid organizationId, Guid tenantId, Guid moduleId, DateTime start, DateTime? end, EntitlementSourceType source, Guid? subscriptionId = null, bool status = true) => new() { OrganizationId = organizationId, TenantId = tenantId, ModuleId = moduleId, StartDate = start, EndDate = end, SourceType = source, OrganizationSubscriptionId = subscriptionId, Status = status };
    public bool IsEffective(DateTime utcNow) => Status && StartDate <= utcNow && (!EndDate.HasValue || EndDate >= utcNow) && (!TrialEndDate.HasValue || TrialEndDate >= utcNow);
}

public sealed class TenantOperation : ControlPlaneEntity
{
    public Guid TenantModuleId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Link { get; private set; } = string.Empty;
    public string Filter { get; private set; } = string.Empty;
    public string Icon { get; private set; } = string.Empty;
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; }
    public TenantNavigationModule TenantModule { get; private set; } = null!;

    private TenantOperation() { }

    public static TenantOperation Create(Guid tenantModuleId, string name, string link, string? filter, string? icon, int displayOrder, bool isActive) => new()
    {
        TenantModuleId = tenantModuleId == Guid.Empty ? throw new ArgumentException("Tenant module ID is required.", nameof(tenantModuleId)) : tenantModuleId,
        Name = string.IsNullOrWhiteSpace(name) ? throw new ArgumentException("Name is required.", nameof(name)) : name.Trim(),
        Link = link?.Trim() ?? string.Empty,
        Filter = filter?.Trim() ?? string.Empty,
        Icon = icon?.Trim() ?? string.Empty,
        DisplayOrder = displayOrder,
        IsActive = isActive
    };

    public static TenantOperation Copy(Guid tenantId, Operation operation, Guid? tenantModuleId = null)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("Tenant ID is required.", nameof(tenantId));
        ArgumentNullException.ThrowIfNull(operation);
        return new TenantOperation
        {
            TenantModuleId = tenantModuleId ?? throw new ArgumentException("Tenant module ID is required.", nameof(tenantModuleId)),
            Name = operation.Name,
            Link = operation.Link,
            Filter = operation.Filter,
            Icon = operation.Icon,
            DisplayOrder = operation.DisplayOrder,
            IsActive = operation.IsActive
        };
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        Touch();
    }

    public void Update(string name, string link, string filter, string icon, Guid tenantModuleId, int displayOrder, bool isActive)
    {
        Name = name;
        Link = link;
        Filter = filter;
        Icon = icon;
        TenantModuleId = tenantModuleId;
        DisplayOrder = displayOrder;
        IsActive = isActive;
        Touch();
    }
}

public sealed class TenantSubscriptionAddOn : ControlPlaneEntity
{
    public Guid TenantId { get; private set; }
    public Guid ModuleId { get; private set; }
    public SubscriptionStatus Status { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = "USD";
}

public sealed class TenantRole : ControlPlaneEntity
{
    public Guid TenantId { get; private set; }
    public Guid? RoleId { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public bool IsCustomized { get; private set; }
    public ICollection<TenantRolePermission> Permissions { get; } = new List<TenantRolePermission>();
    private TenantRole() { }
    public static TenantRole Create(Guid tenantId, string code, string name, Guid? roleId = null) => new() { TenantId = tenantId, Code = code.Trim().ToUpperInvariant(), Name = name.Trim(), RoleId = roleId };
    public void LinkToStandardRole(Guid roleId)
    {
        if (roleId == Guid.Empty) throw new ArgumentException("Standard role ID is required.", nameof(roleId));
        if (RoleId.HasValue && RoleId.Value != roleId) throw new InvalidOperationException("Tenant role is already linked to a different standard role.");
        RoleId = roleId;
        Touch();
    }
    public void MarkCustomized() { IsCustomized = true; Touch(); }
}

public sealed class TenantRolePermission : ControlPlaneEntity
{
    public Guid TenantRoleId { get; private set; }
    public Guid TenantOperationId { get; private set; }
    public bool CanAdd { get; private set; }
    public bool CanEdit { get; private set; }
    public bool CanDelete { get; private set; }
    public bool CanApprove { get; private set; }
    public bool CanView { get; private set; }
    public bool CanExport { get; private set; }
    public TenantRole TenantRole { get; private set; } = null!;
    public TenantOperation TenantOperation { get; private set; } = null!;
    private TenantRolePermission() { }
    public static TenantRolePermission Create(Guid roleId, Guid tenantOperationId, bool add, bool edit, bool delete, bool approve, bool view, bool export = false) => new() { TenantRoleId = roleId, TenantOperationId = tenantOperationId, CanAdd = add, CanEdit = edit, CanDelete = delete, CanApprove = approve, CanView = view, CanExport = export };
}

public sealed class TenantUserRole : ControlPlaneEntity
{
    public Guid TenantUserId { get; private set; }
    public Guid TenantRoleId { get; private set; }
    public DateTime AssignedAt { get; private set; } = DateTime.UtcNow;
    public Guid? AssignedBy { get; private set; }
    public TenantUser TenantUser { get; private set; } = null!;
    public TenantRole TenantRole { get; private set; } = null!;
    private TenantUserRole() { }
    public static TenantUserRole Create(Guid membershipId, Guid roleId, Guid? assignedBy) => new() { TenantUserId = membershipId, TenantRoleId = roleId, AssignedBy = assignedBy };
}
