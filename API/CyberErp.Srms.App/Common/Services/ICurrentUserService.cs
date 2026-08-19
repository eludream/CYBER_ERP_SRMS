namespace CyberErp.Srms.App.Common.Services
{
    public interface ICurrentUserService
    {
        Guid? GetCurrentUserId();
        string? GetCurrentUserName();
    }
}

