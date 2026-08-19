using CyberErp.Srms.Dom.Entities;

namespace CyberErp.Srms.Dom.Entities.Core;

public class Module : BaseEntity
{
    public string Code { get; private set; } = string.Empty;
    public string SubSystem { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string Abbreviation { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string LandingPath { get; private set; } = string.Empty;
    public string? Icon { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; } = true;
    private Module() : base() { }

    public static Module Create(string subSystem, string name, string? icon = null) =>
        Create(name.ToLowerInvariant().Replace(" ", "-"), subSystem, name, string.Empty, string.Empty, icon);

    public static Module Create(
        string code,
        string subSystem,
        string name,
        string description,
        string landingPath,
        string? icon = null,
        int displayOrder = 0,
        bool isActive = true,
        string abbreviation = "")
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Module code cannot be empty.", nameof(code));
        if (string.IsNullOrWhiteSpace(subSystem))
            throw new ArgumentException("SubSystem cannot be empty.", nameof(subSystem));

        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Module name cannot be empty.", nameof(name));

        return new Module
        {
            Code = code.Trim().ToLowerInvariant(),
            SubSystem = subSystem,
            Name = name,
            Abbreviation = abbreviation.Trim(),
            Description = description,
            LandingPath = landingPath,
            Icon = icon,
            DisplayOrder = displayOrder,
            IsActive = isActive
            // TenantId, CreatedBy will be set by Repository.AddAsync()
        };
    }

    public void Update(string code, string subSystem, string name, string description, string landingPath,
        string? icon, int displayOrder, bool isActive, string abbreviation = "")
    {
        if (string.IsNullOrWhiteSpace(code)) throw new ArgumentException("Module code cannot be empty.", nameof(code));
        if (string.IsNullOrWhiteSpace(subSystem)) throw new ArgumentException("SubSystem cannot be empty.", nameof(subSystem));
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Module name cannot be empty.", nameof(name));
        Code = code.Trim().ToLowerInvariant();
        SubSystem = subSystem;
        Name = name;
        Abbreviation = abbreviation.Trim();
        Description = description;
        LandingPath = landingPath;
        Icon = icon;
        DisplayOrder = displayOrder;
        IsActive = isActive;

        base.Update();
    }
    public void UpdateIcon(string? icon)
    {
        Icon = icon;
        base.Update();
    }
   
}

