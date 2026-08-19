using CyberErp.Srms.Dom.Entities;
using CyberErp.Srms.Dom.Events;

namespace CyberErp.Srms.Dom.Entities.Core;

public class Tenant : BaseEntity, IAggregateRoot
{
    public Guid OrganizationId { get; private set; }
    public Guid? TenantTypeId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Identifier { get; private set; } = string.Empty;
    public string? ConnectionString { get; private set; }
    public string? Theme { get; private set; }
    public string? Address { get; private set; }
    public string? PhoneNumber { get; private set; }
    public string? Email { get; private set; }
    public bool IsActive { get; private set; } = true;
    public DateTime? SubscriptionStartDate { get; private set; }
    public DateTime? SubscriptionEndDate { get; private set; }
    public string? TimezoneOverride { get; private set; }
    public string? LocaleOverride { get; private set; }
    public string? CurrencyOverride { get; private set; }
    public Organization Organization { get; private set; } = null!;
    public LookupCategoryItem? TenantType { get; private set; }

    private Tenant() : base() { }

    public static Tenant Create(
        Guid organizationId,
        string name,
        string identifier,
        string? connectionString = null,
        string? theme = null,
        string? address = null,
        string? phoneNumber = null,
        string? email = null,
        DateTime? subscriptionStartDate = null,
        DateTime? subscriptionEndDate = null,
        Guid? tenantTypeId = null)
    {
        if (organizationId == Guid.Empty)
            throw new ArgumentException("Organization ID cannot be empty.", nameof(organizationId));
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Tenant name cannot be empty.", nameof(name));

        if (string.IsNullOrWhiteSpace(identifier))
            throw new ArgumentException("Tenant identifier cannot be empty.", nameof(identifier));

        return new Tenant
        {
            OrganizationId = organizationId,
            TenantTypeId = tenantTypeId,
            Name = name,
            Identifier = identifier,
            ConnectionString = connectionString,
            Theme = theme,
            Address = address,
            PhoneNumber = phoneNumber,
            Email = email,
            IsActive = true,
            SubscriptionStartDate = subscriptionStartDate,
            SubscriptionEndDate = subscriptionEndDate
        };
    }

    [Obsolete("Tenant creation requires an OrganizationId. Use organization-first onboarding.")]
    public static Tenant Create(
        string name,
        string identifier,
        string? connectionString = null,
        string? theme = null,
        string? address = null,
        string? phoneNumber = null,
        string? email = null,
        DateTime? subscriptionStartDate = null,
        DateTime? subscriptionEndDate = null) =>
        throw new InvalidOperationException("Anonymous tenant creation is disabled. An Organization must be created first.");

    public void Update(
        string? name = null,
        string? identifier = null,
        string? connectionString = null,
        string? theme = null,
        string? address = null,
        string? phoneNumber = null,
        string? email = null,
        bool? isActive = null,
        DateTime? subscriptionStartDate = null,
        DateTime? subscriptionEndDate = null,
        Guid? tenantTypeId = null)
    {
        if (name != null)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Tenant name cannot be empty.", nameof(name));
            Name = name;
        }

        if (identifier != null)
        {
            if (string.IsNullOrWhiteSpace(identifier))
                throw new ArgumentException("Tenant identifier cannot be empty.", nameof(identifier));
            Identifier = identifier;
        }

        TenantTypeId = tenantTypeId;

        if (connectionString != null)
            ConnectionString = connectionString;

        if (theme != null)
            Theme = theme;

        if (address != null)
            Address = address;

        if (phoneNumber != null)
            PhoneNumber = phoneNumber;

        if (email != null)
            Email = email;

        if (isActive.HasValue)
            IsActive = isActive.Value;

        if (subscriptionStartDate.HasValue)
            SubscriptionStartDate = subscriptionStartDate;

        if (subscriptionEndDate.HasValue)
            SubscriptionEndDate = subscriptionEndDate;

        base.Update();
    }

    public void Activate()
    {
        IsActive = true;
        base.Update();
    }

    public void Deactivate()
    {
        IsActive = false;
        base.Update();
    }

    public void UpdateSubscription(DateTime? startDate, DateTime? endDate)
    {
        SubscriptionStartDate = startDate;
        SubscriptionEndDate = endDate;
        base.Update();
    }
}
