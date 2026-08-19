using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;
using CyberErp.Srms.App.Features.Core.UserRoles.GetAll;

namespace CyberErp.Srms.App.Features.Core.UserRoles.GetAll
{
    public interface IGetAllUserRoleRepository
    {
        Task<PaginatedResponse<UserRoleResult>> GetAllAsync(GetAllUserRolesRequest request, CancellationToken ct = default);
    }
}
