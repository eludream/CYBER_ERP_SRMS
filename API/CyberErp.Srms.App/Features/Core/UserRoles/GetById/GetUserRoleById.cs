using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;
using CyberErp.Srms.App.Features.Core.UserRoles.GetById;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.UserRoles.GetById
{
    public class GetUserRoleById(
        IGetUserRoleByIdRepository repository,
        ILogger<GetUserRoleById> logger) : IGetUserRoleById
    {
        private readonly IGetUserRoleByIdRepository _repository = repository;
        private readonly ILogger<GetUserRoleById> _logger = logger;

        public async Task<UserRoleDto> GetByIdAsync(Guid id)
        {
            _logger.LogInformation("Getting UserRole with ID: {Id}", id);
            return await _repository.GetByIdAsync(id);
        }
    }
}

