namespace CyberErp.Srms.App.Common.Services;

public interface IStatus
{
    Task<Guid> GetStatusIdAsync(string name);
}
