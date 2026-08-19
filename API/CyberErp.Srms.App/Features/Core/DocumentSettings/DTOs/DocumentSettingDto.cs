namespace CyberErp.Srms.App.Features.Core.DocumentSettings.DTOs;

public class DocumentSettingDto
{
    public Guid Id { get; set; }
    public string VoucherType { get; set; } = string.Empty;
    public string? Prefix { get; set; }
    public string? Sufix { get; set; }
    public string? Year { get; set; }
    public int LastNumber { get; set; }
}