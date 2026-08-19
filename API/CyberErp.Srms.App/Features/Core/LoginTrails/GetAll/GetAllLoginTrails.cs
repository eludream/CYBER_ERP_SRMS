using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.LoginTrails.DTOs;

namespace CyberErp.Srms.App.Features.Core.LoginTrails.GetAll
{
    public class GetAllLoginTrails(IGetAllLoginTrailRepository repository)
        : IFeatureHandler<GetAllRequest, PaginatedResponse<LoginTrailDto>>
    {
        public async Task<PaginatedResponse<LoginTrailDto>> Handle(GetAllRequest request, CancellationToken ct = default)
        {
            var result = await repository.GetAllAsync(request);
            return result;
        }
    }
}

