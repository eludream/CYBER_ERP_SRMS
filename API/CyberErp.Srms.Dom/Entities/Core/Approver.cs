namespace CyberErp.Srms.Dom.Entities.Core;

public class Approver : BaseEntity, IAggregateRoot
{
    public string VoucherType { get; private set; } = string.Empty;
    public Guid ApproverId { get; private set; }
    public Guid StatusId { get; private set; }
    public string Criteria { get; private set; } = string.Empty;
    public User ApproverUser { get; private set; } = null!;
    public VoucherStatus Status { get; private set; } = null!;

    private Approver() : base() { }

    public static Approver Create(
        string voucherType,
        Guid approverId,
        Guid statusId,
        string criteria)
    {
        if (string.IsNullOrWhiteSpace(voucherType))
            throw new ArgumentException("Voucher type cannot be empty.", nameof(voucherType));

        if (approverId == Guid.Empty)
            throw new ArgumentException("Approver ID cannot be empty.", nameof(approverId));

        if (statusId == Guid.Empty)
            throw new ArgumentException("Status ID cannot be empty.", nameof(statusId));

  
        return new Approver
        {
            VoucherType = voucherType,
            ApproverId = approverId,
            StatusId = statusId,
            Criteria = criteria
            // TenantId, CreatedBy will be set by Repository.AddAsync()
        };
    }

    public void Update(
        string? voucherType = null,
        Guid? approverId = null,
        Guid? statusId = null,
        string? criteria = null)
    {
        if (voucherType != null)
        {
            if (string.IsNullOrWhiteSpace(voucherType))
                throw new ArgumentException("Voucher type cannot be empty.", nameof(voucherType));
            VoucherType = voucherType;
        }

        if (approverId.HasValue && approverId.Value != Guid.Empty)
            ApproverId = approverId.Value;

        if (statusId.HasValue && statusId.Value != Guid.Empty)
            StatusId = statusId.Value;

        if (criteria != null)
            Criteria = criteria;

        base.Update();
    }
}

