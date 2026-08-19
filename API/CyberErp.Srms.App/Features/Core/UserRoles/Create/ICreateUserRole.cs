using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;

namespace CyberErp.Srms.App.Features.Core.UserRoles.Create
{
    public interface ICreateUserRole
    {
        Task<UserRoleResult> CreateAsync(UserRoleDto dto);
    }
}

