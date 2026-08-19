namespace CyberErp.Srms.App.Features.Core.FiscalYears.DTOs;

public class FiscalYearDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}