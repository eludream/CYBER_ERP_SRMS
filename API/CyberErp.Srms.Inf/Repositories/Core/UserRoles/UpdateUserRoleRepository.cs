using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;
using CyberErp.Srms.App.Features.Core.UserRoles.Update;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.Inf.Repositories.Core.UserRoles
{
    public class UpdateUserRoleRepository(
        IRepository<UserRole> userRoleRepository,
        ILogger<UpdateUserRoleRepository> logger) : IUpdateUserRoleRepository
    {
        private readonly IRepository<UserRole> _userRoleRepository = userRoleRepository;
        private readonly ILogger<UpdateUserRoleRepository> _logger = logger;

        public async Task<UserRoleResult> UpdateAsync(UserRoleDto dto)
        {
            _logger.LogInformation("Updating UserRole with ID: {Id}", dto.Id);

            var userRole = await _userRoleRepository.GetAll()
                .FirstOrDefaultAsync(x => x.Id == dto.Id);
            if (userRole == null)
            {
                _logger.LogWarning("UserRole with ID: {Id} not found", dto.Id);
                throw new NotFoundException(nameof(UserRole), dto.Id.ToString());
            }

            userRole.Update(dto.RoleId, dto.UserId);
            _userRoleRepository.UpdateAsync(userRole);
            await _userRoleRepository.SaveChangesAsync();

            _logger.LogInformation("UserRole updated successfully with ID: {Id}", userRole.Id);

            return new UserRoleResult
            {
                Id = userRole.Id,
                RoleId = userRole.RoleId,
                UserId = userRole.UserId,
                UpdatedBy = userRole.UpdatedBy,
                UpdatedAt = userRole.UpdatedAt?.InUtc().ToString()
            };
        }
    }
}
