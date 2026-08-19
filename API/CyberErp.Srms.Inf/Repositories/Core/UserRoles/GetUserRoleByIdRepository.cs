using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;
using CyberErp.Srms.App.Features.Core.UserRoles.GetById;
using CyberErp.Srms.Dom.Entities.Core;
using CyberErp.Srms.Inf.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.Inf.Repositories.Core.UserRoles
{
    public class GetUserRoleByIdRepository(
        IRepository<UserRole> userRoleRepository,
        ILogger<GetUserRoleByIdRepository> logger) : IGetUserRoleByIdRepository
    {
        private readonly IRepository<UserRole> _userRoleRepository = userRoleRepository;
        private readonly ILogger<GetUserRoleByIdRepository> _logger = logger;
        public async Task<UserRoleDto> GetByIdAsync(Guid id)
        {
            
            _logger.LogInformation("Getting UserRole by ID: {Id}", id);

            var userRole = await _userRoleRepository.GetAll()
                .Include(ur => ur.Role)
                .Include(ur => ur.User)
                .FirstOrDefaultAsync(ur => ur.Id == id);

            if (userRole == null)
            {
                _logger.LogWarning("UserRole with ID {Id} not found", id);
                throw new NotFoundException(nameof(UserRole), id.ToString());
            }

            return new UserRoleDto
            {
                Id = userRole.Id,
                RoleId = userRole.RoleId,
                UserId = userRole.UserId,
                Role = userRole.Role?.Name ?? string.Empty,
                User = userRole.User?.FullName ?? string.Empty,
                CreatedBy = userRole.CreatedBy
            };
            }

    }
}
