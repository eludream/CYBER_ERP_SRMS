using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Operations.DTOs;
using CyberErp.Srms.App.Features.Core.Operations.GetAll;

namespace CyberErp.Srms.App.Features.Core.Operations.GetAll
{
    public interface IGetAllOperationsRepository
    {
        Task<PaginatedResponse<OperationDto>> GetAllAsync(GetAllOperationsRequest request, CancellationToken ct = default);
    }
}
