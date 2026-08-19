
namespace CyberErp.Srms.Dom.Entities.Core;

public class DocumentSetting : BaseEntity, IAggregateRoot
{
    public string VoucherType { get; private set; } = string.Empty;
    public string? Prefix { get; private set; }
    public string? Sufix { get; private set; }
    public string? Year { get; private set; }
    public int LastNumber { get; private set; }

    private DocumentSetting() : base() { }

    public static DocumentSetting Create(
        string voucherType,
        string? prefix = null,
        string? sufix = null,
        string? year = null,
        int lastNumber = 0)
    {
        if (string.IsNullOrWhiteSpace(voucherType))
            throw new ArgumentException("Voucher type cannot be empty.", nameof(voucherType));

        return new DocumentSetting
        {
            VoucherType = voucherType,
            Prefix = prefix,
            Sufix = sufix,
            Year = year,
            LastNumber = lastNumber
            // TenantId, CreatedBy will be set by Repository.AddAsync()
        };
    }

    public void Update(
        string? voucherType = null,
        string? prefix = null,
        string? sufix = null,
        string? year = null,
        int? lastNumber = null)
    {
        if (voucherType != null)
        {
            if (string.IsNullOrWhiteSpace(voucherType))
                throw new ArgumentException("Voucher type cannot be empty.", nameof(voucherType));
            VoucherType = voucherType;
        }

        if (prefix != null)
            Prefix = prefix;

        if (sufix != null)
            Sufix = sufix;

        if (year != null)
            Year = year;

        if (lastNumber.HasValue && lastNumber.Value >= 0)
            LastNumber = lastNumber.Value;

        base.Update();
    }

    public void IncrementLastNumber()
    {
        LastNumber++;
        base.Update();
    }

    public void SetLastNumber(int number)
    {
        if (number < 0)
            throw new ArgumentException("Last number cannot be negative.", nameof(number));

        LastNumber = number;
        base.Update();
    }
}

