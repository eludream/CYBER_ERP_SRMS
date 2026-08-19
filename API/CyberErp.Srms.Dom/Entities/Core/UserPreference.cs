using CyberErp.Srms.Dom.Entities;

namespace CyberErp.Srms.Dom.Entities.Core;

public class UserPreference : BaseEntity, IAggregateRoot
{
    public Guid UserId { get; private set; }
    public string Language { get; private set; } = "en";
    public string TimeZone { get; private set; } = "Africa/Nairobi";
    public string DateFormat { get; private set; } = "dd/MM/yyyy";
    public string NumberFormat { get; private set; } = "1,234.56";
    public string LandingPage { get; private set; } = "/";
    public string Theme { get; private set; } = "system";
    public bool EmailNotifications { get; private set; } = true;
    public bool InAppNotifications { get; private set; } = true;
    public bool ApprovalNotifications { get; private set; } = true;

    private UserPreference() { }

    public static UserPreference Create(Guid userId, string tenantId)
    {
        if (userId == Guid.Empty) throw new ArgumentException("User is required.", nameof(userId));
        return new UserPreference { UserId = userId, TenantId = tenantId };
    }

    public void UpdatePreferences(string language, string timeZone, string dateFormat, string numberFormat,
        string landingPage, string theme, bool emailNotifications, bool inAppNotifications, bool approvalNotifications)
    {
        Language = Required(language, nameof(language), 10);
        TimeZone = Required(timeZone, nameof(timeZone), 100);
        DateFormat = Required(dateFormat, nameof(dateFormat), 30);
        NumberFormat = Required(numberFormat, nameof(numberFormat), 30);
        LandingPage = Required(landingPage, nameof(landingPage), 200);
        Theme = theme is "light" or "dark" or "system" ? theme : throw new ArgumentException("Invalid theme.", nameof(theme));
        EmailNotifications = emailNotifications;
        InAppNotifications = inAppNotifications;
        ApprovalNotifications = approvalNotifications;
        base.Update();
    }

    private static string Required(string value, string name, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > maxLength) throw new ArgumentException($"Invalid {name}.", name);
        return value.Trim();
    }
}
