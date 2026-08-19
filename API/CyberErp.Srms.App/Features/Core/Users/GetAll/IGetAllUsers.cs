using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Users.DTOs;

namespace CyberErp.Srms.App.Features.Core.Users.GetAll
{
    public interface IGetAllUsers
    {
        Task<PaginatedResponse<UserDto>> GetAllAsync(GetAllRequest request);
    }
}

