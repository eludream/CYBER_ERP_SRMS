namespace CyberErp.Srms.Dom.Entities.Core;

public sealed class LookupCategory : ControlPlaneEntity
{
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public int DisplayOrder { get; private set; }
    public ICollection<LookupCategoryItem> Items { get; } = new List<LookupCategoryItem>();
    private LookupCategory() { }

    public static LookupCategory Create(string code, string name, int displayOrder)
    {
        Validate(code, name, displayOrder);
        return new() { Code = code.Trim(), Name = name.Trim(), DisplayOrder = displayOrder };
    }

    public void Update(string code, string name, int displayOrder)
    {
        Validate(code, name, displayOrder);
        Code = code.Trim(); Name = name.Trim(); DisplayOrder = displayOrder; Touch();
    }

    private static void Validate(string code, string name, int displayOrder)
    {
        if (string.IsNullOrWhiteSpace(code)) throw new ArgumentException("Code is required.", nameof(code));
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Name is required.", nameof(name));
        if (displayOrder < 0) throw new ArgumentOutOfRangeException(nameof(displayOrder));
    }
}

public sealed class LookupCategoryItem : ControlPlaneEntity
{
    public Guid CategoryId { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public int DisplayOrder { get; private set; }
    public LookupCategory Category { get; private set; } = null!;
    private LookupCategoryItem() { }

    public static LookupCategoryItem Create(Guid categoryId, string code, string name, int displayOrder)
    {
        if (categoryId == Guid.Empty) throw new ArgumentException("Category is required.", nameof(categoryId));
        Validate(code, name, displayOrder);
        return new() { CategoryId = categoryId, Code = code.Trim(), Name = name.Trim(), DisplayOrder = displayOrder };
    }

    public void Update(string code, string name, int displayOrder)
    {
        Validate(code, name, displayOrder);
        Code = code.Trim(); Name = name.Trim(); DisplayOrder = displayOrder; Touch();
    }

    private static void Validate(string code, string name, int displayOrder)
    {
        if (string.IsNullOrWhiteSpace(code)) throw new ArgumentException("Code is required.", nameof(code));
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Name is required.", nameof(name));
        if (displayOrder < 0) throw new ArgumentOutOfRangeException(nameof(displayOrder));
    }
}
