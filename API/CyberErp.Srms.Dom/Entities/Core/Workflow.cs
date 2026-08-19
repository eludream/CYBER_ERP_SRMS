namespace CyberErp.Srms.Dom.Entities.Core;

public class Workflow : BaseEntity, IAggregateRoot
{
    public int Step { get; private set; }
    public string VoucherType { get; private set; } = string.Empty;
    public Guid StatusId { get; private set; }
    public VoucherStatus Status { get; private set; } = null!;

    private Workflow() : base() { }

    public static Workflow Create(
        int step,
        string voucherType,
        Guid statusId)
    {
        if (string.IsNullOrWhiteSpace(voucherType))
            throw new ArgumentException("Voucher type cannot be empty.", nameof(voucherType));

        if (statusId == Guid.Empty)
            throw new ArgumentException("Status ID cannot be empty.", nameof(statusId));

        return new Workflow
        {
            Step = step,
            VoucherType = voucherType,
            StatusId = statusId
            // TenantId, CreatedBy will be set by Repository.AddAsync()
        };
    }

    public void Update(int? step = null, string? voucherType = null, Guid? statusId = null)
    {
        if (step.HasValue) Step = step.Value;

        if (voucherType != null)
        {
            if (string.IsNullOrWhiteSpace(voucherType))
                throw new ArgumentException("Voucher type cannot be empty.", nameof(voucherType));
            VoucherType = voucherType;
        }

        if (statusId.HasValue && statusId.Value != Guid.Empty)
            StatusId = statusId.Value;

        base.Update();
    }
}

