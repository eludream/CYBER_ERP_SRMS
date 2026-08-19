using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.App.Features.Core.UserRoles.Delete;
using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.Inf.Repositories.Core.UserRoles
{
    public class DeleteUserRoleRepository(
        IRepository<UserRole> userRoleRepository,
        ILogger<DeleteUserRoleRepository> logger) : IDeleteUserRoleRepository
    {
        private readonly IRepository<UserRole> _userRoleRepository = userRoleRepository;
        private readonly ILogger<DeleteUserRoleRepository> _logger = logger;

        public async Task<UserRoleResult> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Deleting UserRole with ID: {Id}", id);

            var userRole = await _userRoleRepository.GetByIdAsync(id);
            if (userRole == null)
            {
                _logger.LogWarning("UserRole with ID: {Id} not found", id);
                throw new NotFoundException(nameof(UserRole), id.ToString());
            }

            _userRoleRepository.Delete(userRole);
            await _userRoleRepository.SaveChangesAsync();

            _logger.LogInformation("UserRole deleted successfully with ID: {Id}", id);

            return new UserRoleResult
            {
                Id = id
            };
        }
    }
}
