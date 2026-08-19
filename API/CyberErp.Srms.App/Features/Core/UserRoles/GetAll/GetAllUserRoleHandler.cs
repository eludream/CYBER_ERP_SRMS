using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;
using CyberErp.Srms.App.Features.Core.UserRoles.GetAll;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.UserRoles.GetAll;

public class GetAllUserRoleHandler(
    IGetAllUserRoleRepository repository,
    ILogger<GetAllUserRoleHandler> logger)
    : IFeatureHandler<GetAllUserRolesRequest, PaginatedResponse<UserRoleResult>>
{
    public async Task<PaginatedResponse<UserRoleResult>> Handle(GetAllUserRolesRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Fetching all UserRoles with pagination");
        var result = await repository.GetAllAsync(request, ct);
        logger.LogInformation("Retrieved {Count} UserRoles", result.Data.Count());
        return result;
    }
}
