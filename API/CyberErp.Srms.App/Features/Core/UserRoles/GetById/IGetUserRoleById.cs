using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;

namespace CyberErp.Srms.App.Features.Core.UserRoles.GetById
{
    public interface IGetUserRoleById
    {
        Task<UserRoleDto> GetByIdAsync(Guid id);
    }
}

