using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Modules.DTOs;

namespace CyberErp.Srms.App.Features.Core.Modules.GetAll
{
    public interface IGetAllModuleRepository
    {
        Task<PaginatedResponse<GetModuleDto>> GetAllAsync(GetAllRequest request, CancellationToken ct = default);
    }
}

