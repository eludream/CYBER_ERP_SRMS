namespace CyberErp.Srms.App.Features.Core.Users.GetCurrentUser
{
    using CyberErp.Srms.App.Features.Core.Users.DTOs;

    public interface IGetCurrentUser
    {
        Task<CurrentUserResult> GetAsync(CancellationToken cancellationToken = default);
    }
}
