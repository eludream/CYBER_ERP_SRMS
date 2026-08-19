using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.LoginTrails.DTOs;

namespace CyberErp.Srms.App.Features.Core.LoginTrails.GetAll
{
    public interface IGetAllLoginTrailRepository
    {
        Task<PaginatedResponse<LoginTrailDto>> GetAllAsync(GetAllRequest request, CancellationToken ct = default);
    }
}

