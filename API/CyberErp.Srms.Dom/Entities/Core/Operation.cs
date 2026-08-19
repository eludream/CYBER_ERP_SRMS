namespace CyberErp.Srms.Dom.Entities.Core;

public class Operation : BaseEntity
{
    public Guid ModuleId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Link { get; private set; } = string.Empty;
    public string Filter { get; private set; } = string.Empty;
    public string Icon { get; private set; } = string.Empty;
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; } = true;
    public NavigationModule Module { get; private set; } = null!;

    private Operation() : base() { }

    public static Operation Create(
        Guid moduleId,
        string name,
        string link,
        string filter,
        string icon,
        int displayOrder = 0,
        bool isActive = true)
    {
        if (moduleId == Guid.Empty)
            throw new ArgumentException("Module ID cannot be empty.", nameof(moduleId));

        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Operation name cannot be empty.", nameof(name));

        return new Operation
        {
            ModuleId = moduleId,
            Name = name,
            Link = link ?? string.Empty,
            Filter = filter ?? string.Empty,
            Icon = icon ?? string.Empty,
            DisplayOrder = displayOrder,
            IsActive = isActive
            // TenantId, CreatedBy will be set by Repository.AddAsync()
        };
    }

    public void Update(
        Guid moduleId,
        string name,
        string link,
        string filter,
        string icon,
        int displayOrder,
        bool isActive)
    {
        if (moduleId == Guid.Empty)
            throw new ArgumentException("Module ID cannot be empty.", nameof(moduleId));

        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Operation name cannot be empty.", nameof(name));

        ModuleId = moduleId;
        Name = name;
        Link = link ?? string.Empty;
        Filter = filter ?? string.Empty;
        Icon = icon ?? string.Empty;
        DisplayOrder = displayOrder;
        IsActive = isActive;
        base.Update();
    }
}

