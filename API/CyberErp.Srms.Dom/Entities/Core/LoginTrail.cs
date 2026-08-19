using CyberErp.Srms.Dom.Entities;

namespace CyberErp.Srms.Dom.Entities.Core;

public class LoginTrail : BaseEntity, IAggregateRoot
{
    public Guid? UserId { get; private set; }
    public DateTime Date { get; private set; }
    public string IpAddress { get; private set; } = string.Empty;
    public string? Status { get; private set; }
    public string UserNameAttempted { get; private set; } = string.Empty;
    public string? UserAgent { get; private set; }
    public string? FailureReason { get; private set; }
    public string EventType { get; private set; } = "Login";
    public User? User { get; private set; }

    private LoginTrail() : base() { }

    public static LoginTrail Create(
        Guid? userId,
        DateTime date,
        string ipAddress,
        string? status = null)
    {
        if (string.IsNullOrWhiteSpace(ipAddress))
            throw new ArgumentException("IP address cannot be empty.", nameof(ipAddress));

        return new LoginTrail
        {
            UserId = userId,
            Date = date,
            IpAddress = ipAddress,
            Status = status
            // TenantId, CreatedBy will be set by Repository.AddAsync()
        };
    }

    public void UpdateStatus(string status)
    {
        Status = status;
        base.Update();
    }

    public void SetDetails(string userNameAttempted, string? userAgent, string? failureReason, string eventType = "Login")
    {
        UserNameAttempted = userNameAttempted;
        UserAgent = userAgent;
        FailureReason = failureReason;
        EventType = eventType;
        base.Update();
    }

    public void Update(
        Guid? userId = null,
        DateTime? date = null,
        string? ipAddress = null,
        string? status = null)
    {
        if (ipAddress != null)
        {
            if (string.IsNullOrWhiteSpace(ipAddress))
                throw new ArgumentException("IP address cannot be empty.", nameof(ipAddress));
            IpAddress = ipAddress;
        }

        if (userId.HasValue)
            UserId = userId.Value;

        if (date.HasValue)
            Date = date.Value;

        if (status != null)
            Status = status;

        base.Update();
    }
}

