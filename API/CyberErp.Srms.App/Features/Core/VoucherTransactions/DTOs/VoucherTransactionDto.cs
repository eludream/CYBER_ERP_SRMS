namespace CyberErp.Srms.App.Features.Core.VoucherTransactions.DTOs;

public class GetVoucherTransactionDto
{
    public Guid Id { get; set; }
    public string VoucherType { get; set; } = string.Empty;
    public Guid ApproverId { get; set; }
    public Guid VoucherId { get; set; }
    public Guid StatusId { get; set; }
    public string VoucherNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Approver { get; set; } = string.Empty;
    public DateTime Date { get; set; }
}

