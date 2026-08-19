using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;

namespace CyberErp.Srms.App.Features.Core.UserRoles.Create
{
    public interface ICreateUserRoleRepository
    {
        Task<UserRoleResult> CreateAsync(UserRoleDto dto);
    }
}
