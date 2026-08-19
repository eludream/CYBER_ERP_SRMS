using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;

namespace CyberErp.Srms.App.Features.Core.UserRoles.Update
{
    public interface IUpdateUserRole
    {
        Task<UserRoleResult> UpdateAsync(UserRoleDto dto);
    }
}

