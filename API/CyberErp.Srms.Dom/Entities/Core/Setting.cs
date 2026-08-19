using System;

namespace CyberErp.Srms.Dom.Entities.Core
{
    public class Setting : BaseEntity
    {
        public string? Type { get; private set; }
        public string? SettingKey { get; private set; }
        public string? SettingValue { get; private set; }
        public string? Description { get; private set; }

        private Setting() : base() { }

        public static Setting Create(
            string? type,
            string settingKey,
            string? settingValue = null,
            string? description = null)
        {
            if (string.IsNullOrWhiteSpace(settingKey))
                throw new ArgumentException("SettingKey cannot be empty.", nameof(settingKey));

            return new Setting
            {
                Type = type,
                SettingKey = settingKey,
                SettingValue = settingValue,
                Description = description
            };
        }

        public void Update(
            string? type,
            string settingKey,
            string? settingValue,
            string? description)
        {
            if (string.IsNullOrWhiteSpace(settingKey))
                throw new ArgumentException("SettingKey cannot be empty.", nameof(settingKey));

            Type = type;
            SettingKey = settingKey;
            SettingValue = settingValue;
            Description = description;
            base.Update();
        }
    }
}

public sealed class PlatformSystemSettings
{
    public Guid Id { get; set; }
    public int MinimumPasswordLength { get; set; } = 8;
    public bool RequireUppercase { get; set; } = true;
    public bool RequireNumbers { get; set; } = true;
    public bool RequireSpecialCharacters { get; set; } = true;
    public int PasswordExpiryDays { get; set; } = 90;
    public int PasswordHistoryCount { get; set; } = 5;
    public int SessionTimeoutMinutes { get; set; } = 30;
    public int MaxConcurrentSessions { get; set; } = 3;
    public int MaxLoginAttempts { get; set; } = 5;
    public int LockoutDurationMinutes { get; set; } = 30;
    public bool EnforceTwoFactorForAll { get; set; }
    public bool EnforceTwoFactorForAdmins { get; set; } = true;
    public string SmtpHost { get; set; } = "";
    public int SmtpPort { get; set; } = 587;
    public string SmtpUser { get; set; } = "";
    public bool SmtpUseTls { get; set; } = true;
    public bool AutoBackup { get; set; } = true;
    public string BackupFrequency { get; set; } = "daily";
    public int BackupRetentionDays { get; set; } = 30;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
