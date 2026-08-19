using CyberErp.Srms.Dom.Entities.Core;
using NodaTime;

namespace CyberErp.Srms.Dom.Entities;

/// <summary>
/// Base entity for voucher-type transactions (Payment, Collection, Expense, Issue, Receive, etc.)
/// </summary>
public abstract class VoucherBaseEntity : BaseEntity
{
    public string VoucherNumber { get; internal set; } = string.Empty;
    public string? ReferenceNo { get; internal set; }
    public Instant Date { get; internal set; }
    public decimal Amount { get; internal set; }
    public string? Reason { get; internal set; }
    public string? Remark { get; internal set; }
    public Guid? FiscalYearId { get; internal set; }
    public Guid StatusId { get; set; }
    public Guid PreparedById { get; internal set; }
    public VoucherStatus Status { get; internal set; } = null!;
    public FiscalYear? FiscalYear { get; internal set; }
    public User PreparedBy { get; internal set; }

    // Protected constructor for EF Core
    protected VoucherBaseEntity() : base() { }

    // Common validation for voucher creation
    protected static void ValidateVoucher(string voucherNumber, decimal amount)
    {
        if (string.IsNullOrWhiteSpace(voucherNumber))
            throw new ArgumentException("VoucherNumber cannot be empty.", nameof(voucherNumber));

        if (amount < 0)
            throw new ArgumentException("Amount cannot be negative.", nameof(amount));
    }

    // Common update method for vouchers
    protected void UpdateVoucher(
        string? referenceNo,
        Instant date,
        decimal amount,
        string? reason,
        string? remark)
    {
        if (amount < 0)
            throw new ArgumentException("Amount cannot be negative.", nameof(amount));

        ReferenceNo = referenceNo;
        Date = date;
        Amount = amount;
        Reason = reason;
        Remark = remark;

        base.Update();
    }
    protected void SetFiscalYear(Guid fiscalYearId)
    {
         FiscalYearId = fiscalYearId;
    }
    public void UpdateStatus(Guid statusId)
    {
        if (statusId == Guid.Empty)
            throw new ArgumentException("StatusId can not be empty", nameof(statusId));
            
        StatusId = statusId;
    }
}

