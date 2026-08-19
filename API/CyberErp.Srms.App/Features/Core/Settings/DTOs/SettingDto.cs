namespace CyberErp.Srms.App.Features.Core.Settings.DTOs;

public class SettingDto
{
    public Guid Id { get; set; }
    public string? Type { get; set; }
    public string? SettingKey { get; set; }
    public string? SettingValue { get; set; }
    public string? Description { get; set; }
}