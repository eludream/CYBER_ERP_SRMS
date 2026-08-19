using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;

namespace CyberErp.Srms.App.Features.Core.UserRoles.Delete
{
    public interface IDeleteUserRoleRepository
    {
        Task<UserRoleResult> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    }
}
