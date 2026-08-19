namespace CyberErp.Srms.App.Features.Core.Users.GetCurrentUser
{
    using CyberErp.Srms.App.Features.Core.Users.DTOs;

    public interface IGetCurrentUserRepository
    {
        Task<CurrentUserResult> GetAsync(CancellationToken cancellationToken = default);
    }
}
