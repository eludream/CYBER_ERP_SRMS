namespace CyberErp.Srms.Dom.Entities.Core;

public class VoucherStatus : BaseEntity, IAggregateRoot
{
    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;

    private VoucherStatus() : base() { }

    public static VoucherStatus Create(string name, string code)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Status name cannot be empty.", nameof(name));

        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Status code cannot be empty.", nameof(code));

        return new VoucherStatus
        {
            Name = name,
            Code = code
        };
    }

    public void Update(string name, string code)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Status name cannot be empty.", nameof(name));

        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Status code cannot be empty.", nameof(code));

        Name = name;
        Code = code;
        base.Update();
    }
}
