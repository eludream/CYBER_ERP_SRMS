using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Users.DTOs;

namespace CyberErp.Srms.App.Features.Core.Users.GetAll
{
    public interface IGetAllUserRepository
    {
        Task<PaginatedResponse<UserDto>> GetAllAsync(GetAllRequest request, CancellationToken ct = default);
    }
}