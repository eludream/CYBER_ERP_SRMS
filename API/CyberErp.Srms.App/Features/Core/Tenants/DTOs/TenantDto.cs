namespace CyberErp.Srms.App.Features.Core.Tenants.DTOs;

public class TenantDto
{
    public Guid Id { get; set; }
    public Guid? TenantTypeId { get; set; }
    public string? TenantTypeName { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Identifier { get; set; } = string.Empty;
    public string? ConnectionString { get; set; }
    public string? Theme { get; set; }
    public string? Address { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public bool IsActive { get; set; }
    public DateTime? SubscriptionStartDate { get; set; }
    public DateTime? SubscriptionEndDate { get; set; }
    public string? CreatedBy { get; set; }
    public string? CreatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public string? UpdatedAt { get; set; }
}
