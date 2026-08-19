namespace CyberErp.Srms.Dom.Entities.Core;

public class VoucherTransaction : BaseEntity, IAggregateRoot
{
    public string VoucherType { get; private set; } = string.Empty;
    public Guid ApproverId { get; private set; }
    public Guid VoucherId { get; private set; }
    public Guid StatusId { get; private set; }
    public string VoucherNumber { get; private set; } = string.Empty;
    public DateTime Date { get; private set; }
    public User Approver { get; private set; } = null!;
    public VoucherStatus Status { get; private set; } = null!;
    public string? Remark { get; private set; }

    private VoucherTransaction() : base() { }

    public static VoucherTransaction Create(
        string voucherType,
        Guid approverId,
        Guid voucherId,
        Guid statusId,
        string voucherNumber,
        DateTime date,
        string? remark = null)
    {
        if (string.IsNullOrWhiteSpace(voucherType))
            throw new ArgumentException("Voucher type cannot be empty.", nameof(voucherType));

        if (approverId == Guid.Empty)
            throw new ArgumentException("Approver ID cannot be empty.", nameof(approverId));

        if (voucherId == Guid.Empty)
            throw new ArgumentException("Voucher ID cannot be empty.", nameof(voucherId));

        if (statusId == Guid.Empty)
            throw new ArgumentException("Status ID cannot be empty.", nameof(statusId));

        if (string.IsNullOrWhiteSpace(voucherNumber))
            throw new ArgumentException("Voucher number cannot be empty.", nameof(voucherNumber));

        return new VoucherTransaction
        {
            VoucherType = voucherType,
            ApproverId = approverId,
            VoucherId = voucherId,
            StatusId = statusId,
            VoucherNumber = voucherNumber,
            Date = date,
            Remark = remark
            // TenantId, CreatedBy will be set by Repository.AddAsync()
        };
    }

    public void Update(
        string voucherType,
        Guid approverId,
        Guid voucherId,
        Guid statusId,
        string voucherNumber,
        DateTime date,
        string? remark = null)
    {
        if (string.IsNullOrWhiteSpace(voucherType))
            throw new ArgumentException("Voucher type cannot be empty.", nameof(voucherType));

        if (approverId == Guid.Empty)
            throw new ArgumentException("Approver ID cannot be empty.", nameof(approverId));

        if (voucherId == Guid.Empty)
            throw new ArgumentException("Voucher ID cannot be empty.", nameof(voucherId));

        if (statusId == Guid.Empty)
            throw new ArgumentException("Status ID cannot be empty.", nameof(statusId));

        if (string.IsNullOrWhiteSpace(voucherNumber))
            throw new ArgumentException("Voucher number cannot be empty.", nameof(voucherNumber));

        VoucherType = voucherType;
        ApproverId = approverId;
        VoucherId = voucherId;
        StatusId = statusId;
        VoucherNumber = voucherNumber;
        Date = date;
        Remark = remark;
        base.Update();
    }
}

