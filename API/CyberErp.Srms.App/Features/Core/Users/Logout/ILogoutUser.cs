using System.Security.Claims;

namespace CyberErp.Srms.App.Features.Core.Users.Logout
{
    public interface ILogoutUser
    {
        Task<bool> LogoutAsync(string tokenId);
    }
    
    public interface ILogoutCookieUser
    {
        Task<bool> LogoutAsync();
    }
}
