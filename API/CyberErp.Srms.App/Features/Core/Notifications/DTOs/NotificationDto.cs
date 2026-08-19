namespace CyberErp.Srms.App.Features.Core.Notifications.DTOs;

public class NotificationDto
{
    public string VoucherType { get; set; } = string.Empty;
    public Guid ApproverId { get; set; }
    public Guid VoucherId { get; set; }
    public string VoucherNumber { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Criteria { get; set; } = string.Empty;
    public bool IsResponded { get; set; } = false;
    public bool IsEmailed { get; set; } = false;
    public bool IsViewed { get; set; } = false;
    public bool IsSms { get; set; } = false;
    public Guid StatusId { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class GetNotificationDto
{
    public Guid Id { get; set; }
    public string VoucherType { get; set; } = string.Empty;
    public Guid ApproverId { get; set; }
    public Guid VoucherId { get; set; }
    public string VoucherNumber { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Criteria { get; set; } = string.Empty;
    public string Approver { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsResponded { get; set; }
    public bool IsEmailed { get; set; }
    public bool IsViewed { get; set; }
    public bool IsSms { get; set; }
    public Guid StatusId { get; set; }
    public string Message { get; set; } = string.Empty;
}