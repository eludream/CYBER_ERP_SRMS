using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;
using CyberErp.Srms.App.Features.Core.UserRoles.Delete;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.UserRoles.Delete
{
    public class DeleteUserRole(
        IDeleteUserRoleRepository userRoleRepository,
        ILogger<DeleteUserRole> logger) : IDeleteUserRole
    {
        private readonly IDeleteUserRoleRepository _userRoleRepository = userRoleRepository;
        private readonly ILogger<DeleteUserRole> _logger = logger;

        public async Task<UserRoleResult> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Deleting UserRole with Id: {Id}", id);
            return await _userRoleRepository.DeleteAsync(id, cancellationToken);
        }
    }
}

