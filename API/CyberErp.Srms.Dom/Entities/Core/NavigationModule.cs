using CyberErp.Srms.Dom.Entities;

namespace CyberErp.Srms.Dom.Entities.Core;

/// <summary>
/// A navigational module within a subsystem.  This is intentionally distinct
/// from <see cref="Module"/>, which represents the platform subsystem.
/// </summary>
public sealed class NavigationModule : BaseEntity
{
    public Guid SubSystemId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Filter { get; private set; } = string.Empty;
    public string Icon { get; private set; } = string.Empty;
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; } = true;
    public Module SubSystem { get; private set; } = null!;

    private NavigationModule() : base() { }

    public static NavigationModule Create(Guid subSystemId, string name, string? filter, string? icon, int displayOrder, bool isActive = true) =>
        new()
        {
            SubSystemId = subSystemId == Guid.Empty ? throw new ArgumentException("SubSystem ID is required.", nameof(subSystemId)) : subSystemId,
            Name = string.IsNullOrWhiteSpace(name) ? throw new ArgumentException("Name is required.", nameof(name)) : name.Trim(),
            Filter = filter ?? string.Empty,
            Icon = icon ?? string.Empty,
            DisplayOrder = displayOrder,
            IsActive = isActive
        };

    public void Update(string name, string? filter, string? icon, int displayOrder, bool isActive)
    {
        Name = string.IsNullOrWhiteSpace(name) ? throw new ArgumentException("Name is required.", nameof(name)) : name.Trim();
        Filter = filter ?? string.Empty;
        Icon = icon ?? string.Empty;
        DisplayOrder = displayOrder;
        IsActive = isActive;
        base.Update();
    }
}

/// <summary>A tenant-owned clone of a platform navigation module.</summary>
public sealed class TenantNavigationModule : BaseEntity
{
    public Guid TenantId { get; private set; }
    public Guid SubSystemId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Filter { get; private set; } = string.Empty;
    public string Icon { get; private set; } = string.Empty;
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; } = true;
    public Tenant Tenant { get; private set; } = null!;
    public Module SubSystem { get; private set; } = null!;

    private TenantNavigationModule() : base() { }

    public static TenantNavigationModule Copy(Guid tenantId, NavigationModule source) =>
        new()
        {
            TenantId = tenantId == Guid.Empty ? throw new ArgumentException("Tenant ID is required.", nameof(tenantId)) : tenantId,
            SubSystemId = source.SubSystemId,
            Name = source.Name,
            Filter = source.Filter,
            Icon = source.Icon,
            DisplayOrder = source.DisplayOrder,
            IsActive = source.IsActive
        };

    public static TenantNavigationModule Create(Guid tenantId, Guid subSystemId, string name, string? filter, string? icon, int displayOrder, bool isActive = true) =>
        new()
        {
            TenantId = tenantId == Guid.Empty ? throw new ArgumentException("Tenant ID is required.", nameof(tenantId)) : tenantId,
            SubSystemId = subSystemId == Guid.Empty ? throw new ArgumentException("SubSystem ID is required.", nameof(subSystemId)) : subSystemId,
            Name = string.IsNullOrWhiteSpace(name) ? throw new ArgumentException("Name is required.", nameof(name)) : name.Trim(),
            Filter = filter ?? string.Empty, Icon = icon ?? string.Empty, DisplayOrder = displayOrder, IsActive = isActive
        };

    public void Update(string name, string? filter, string? icon, int displayOrder, bool isActive)
    {
        Name = string.IsNullOrWhiteSpace(name) ? throw new ArgumentException("Name is required.", nameof(name)) : name.Trim();
        Filter = filter ?? string.Empty; Icon = icon ?? string.Empty; DisplayOrder = displayOrder; IsActive = isActive;
        base.Update();
    }
}
