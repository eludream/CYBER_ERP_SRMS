using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;

namespace CyberErp.Srms.App.Features.Core.UserRoles.Update
{
    public interface IUpdateUserRoleRepository
    {
        Task<UserRoleResult> UpdateAsync(UserRoleDto dto);
    }
}

