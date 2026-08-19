namespace CyberErp.Srms.App.Features.Core.Users.GetCurrentUser
{
    using CyberErp.Srms.App.Features.Core.Users.DTOs;

    public class GetCurrentUser : IGetCurrentUser
    {
        private readonly IGetCurrentUserRepository _repository;

        public GetCurrentUser(IGetCurrentUserRepository repository)
        {
            _repository = repository;
        }

        public async Task<CurrentUserResult> GetAsync(CancellationToken cancellationToken = default)
        {
            return await _repository.GetAsync(cancellationToken);
        }
    }
}
