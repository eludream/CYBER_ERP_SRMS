using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.UserRoles.Create;
using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.Inf.Repositories.Core.UserRoles
{
    public class CreateUserRoleRepository(
        IRepository<UserRole> userRoleRepository,
        ILogger<CreateUserRoleRepository> logger) : ICreateUserRoleRepository
    {
        private readonly IRepository<UserRole> _userRoleRepository = userRoleRepository;
        private readonly ILogger<CreateUserRoleRepository> _logger = logger;

        public async Task<UserRoleResult> CreateAsync(UserRoleDto dto)
        {
            _logger.LogInformation("Creating new UserRole for User: {UserId} Role: {RoleId}", dto.UserId, dto.RoleId);

            var userRole = UserRole.Create(
                dto.RoleId,
                dto.UserId);

            await _userRoleRepository.AddAsync(userRole);
            await _userRoleRepository.SaveChangesAsync();

            _logger.LogInformation("UserRole created successfully with ID: {Id}", userRole.Id);

            return new UserRoleResult
            {
                Id = userRole.Id,
                RoleId = userRole.RoleId,
                UserId = userRole.UserId,
                CreatedAt = userRole.CreatedAt.InUtc().ToString()
            };
        }
    }
}
