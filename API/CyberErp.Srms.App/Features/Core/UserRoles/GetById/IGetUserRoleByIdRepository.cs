using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;

namespace CyberErp.Srms.App.Features.Core.UserRoles.GetById
{
    public interface IGetUserRoleByIdRepository
    {
        Task<UserRoleDto> GetByIdAsync(Guid id);
    }
}

