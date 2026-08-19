using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;
using CyberErp.Srms.App.Features.Core.UserRoles.GetAll;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.UserRoles.GetAll
{
    public class GetAllUserRole(
        IGetAllUserRoleRepository repository,
        ILogger<GetAllUserRole> logger) : IGetAllUserRole
    {
        private readonly IGetAllUserRoleRepository _repository = repository;
        private readonly ILogger<GetAllUserRole> _logger = logger;

    public async Task<PaginatedResponse<UserRoleResult>> GetAllAsync(GetAllUserRolesRequest request)
    {
        _logger.LogInformation("Fetching all UserRoles with pagination");
        var result = await _repository.GetAllAsync(request);
        _logger.LogInformation("Retrieved {Count} UserRoles", result.Data.Count());
        return result;
    }
    }
}

