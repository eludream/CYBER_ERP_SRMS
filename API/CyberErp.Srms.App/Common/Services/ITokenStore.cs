using System.Security.Claims;
using CyberErp.Srms.App.Features.Core.Users.DTOs;

namespace CyberErp.Srms.App.Common.Services
{
    public interface ITokenStore
    {
        string GenerateToken(UserResult user);
        ClaimsPrincipal? ValidateToken(string token);
        Task StoreAsync(string tokenId, DateTime expiresAt);
        Task RevokeAsync(string tokenId);
        Task<bool> IsRevokedAsync(string tokenId);
    }
}

