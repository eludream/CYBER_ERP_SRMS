namespace CyberErp.Srms.Dom.Entities.Core;

public class Notification : BaseEntity, IAggregateRoot
{
    public string VoucherType { get; private set; } = string.Empty;
    public Guid ApproverId { get; private set; }
    public Guid VoucherId { get; private set; }
    public string VoucherNumber { get; private set; } = string.Empty;
    public DateTime Date { get; private set; }
    public string Criteria { get; private set; } = string.Empty;
    public bool IsResponded { get; private set; }
    public bool IsEmailed { get; private set; }
    public bool IsViewed { get; private set; }
    public bool IsSms { get; private set; }
    public Guid StatusId { get; private set; }
    public string Message { get; private set; } = string.Empty;
    public User Approver { get; private set; } = null!;
    public VoucherStatus Status { get; private set; } = null!;

    private Notification() : base() { }

    public static Notification Create(
        string voucherType,
        Guid approverId,
        Guid voucherId,
        string voucherNumber,
        DateTime date,
        string criteria,
        Guid statusId,
        string message)
    {
        if (string.IsNullOrWhiteSpace(voucherType))
            throw new ArgumentException("Voucher type cannot be empty.", nameof(voucherType));

        if (approverId == Guid.Empty)
            throw new ArgumentException("Approver ID cannot be empty.", nameof(approverId));

        if (voucherId == Guid.Empty)
            throw new ArgumentException("Voucher ID cannot be empty.", nameof(voucherId));

        if (string.IsNullOrWhiteSpace(voucherNumber))
            throw new ArgumentException("Voucher number cannot be empty.", nameof(voucherNumber));

        if (string.IsNullOrWhiteSpace(message))
            throw new ArgumentException("Message cannot be empty.", nameof(message));

        if (statusId == Guid.Empty)
            throw new ArgumentException("Status ID cannot be empty.", nameof(statusId));

        return new Notification
        {
            VoucherType = voucherType,
            ApproverId = approverId,
            VoucherId = voucherId,
            VoucherNumber = voucherNumber,
            Date = date,
            Criteria = criteria,
            StatusId = statusId,
            Message = message
            // TenantId, CreatedBy will be set by Repository.AddAsync()
        };
    }

    public void MarkAsResponded()
    {
        IsResponded = true;
        base.Update();
    }

    public void MarkAsViewed()
    {
        IsViewed = true;
        base.Update();
    }

    public void MarkAsEmailed()
    {
        IsEmailed = true;
        base.Update();
    }

    public void MarkAsSms()
    {
        IsSms = true;
        base.Update();
    }

    public void UpdateStatus(Guid statusId)
    {
        if (statusId == Guid.Empty)
            throw new ArgumentException("Status ID cannot be empty.", nameof(statusId));

        StatusId = statusId;
        base.Update();
    }

    public void Update(
        string? voucherType = null,
        Guid? approverId = null,
        Guid? voucherId = null,
        string? voucherNumber = null,
        DateTime? date = null,
        string? criteria = null,
        bool? isResponded = null,
        bool? isEmailed = null,
        bool? isViewed = null,
        bool? isSms = null,
        Guid? statusId = null,
        string? message = null)
    {
        if (voucherType != null)
        {
            if (string.IsNullOrWhiteSpace(voucherType))
                throw new ArgumentException("Voucher type cannot be empty.", nameof(voucherType));
            VoucherType = voucherType;
        }

        if (approverId.HasValue && approverId.Value != Guid.Empty)
            ApproverId = approverId.Value;

        if (voucherId.HasValue && voucherId.Value != Guid.Empty)
            VoucherId = voucherId.Value;

        if (voucherNumber != null)
            VoucherNumber = voucherNumber;

        if (date.HasValue)
            Date = date.Value;

        if (criteria != null)
            Criteria = criteria;

        if (isResponded.HasValue)
            IsResponded = isResponded.Value;

        if (isEmailed.HasValue)
            IsEmailed = isEmailed.Value;

        if (isViewed.HasValue)
            IsViewed = isViewed.Value;

        if (isSms.HasValue)
            IsSms = isSms.Value;

        if (statusId.HasValue && statusId.Value != Guid.Empty)
            StatusId = statusId.Value;

        if (message != null)
            Message = message;

        base.Update();
    }
}

