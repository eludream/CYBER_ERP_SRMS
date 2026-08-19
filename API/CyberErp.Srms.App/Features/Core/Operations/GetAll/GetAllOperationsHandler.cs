using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.Operations.DTOs;

namespace CyberErp.Srms.App.Features.Core.Operations.GetAll;

public class GetAllOperationsHandler(IGetAllOperationsRepository repository)
    : IFeatureHandler<GetAllOperationsRequest, PaginatedResponse<OperationDto>>
{
    public async Task<PaginatedResponse<OperationDto>> Handle(GetAllOperationsRequest request, CancellationToken ct = default)
    {
        return await repository.GetAllAsync(request, ct);
    }
}
