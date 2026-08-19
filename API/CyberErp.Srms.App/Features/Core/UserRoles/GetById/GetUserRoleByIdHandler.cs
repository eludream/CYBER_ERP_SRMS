using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;
using CyberErp.Srms.App.Features.Core.UserRoles.GetById;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.UserRoles.GetById;

public class GetUserRoleByIdHandler(
    IRepository<UserRole> repository,
    ILogger<GetUserRoleByIdHandler> logger)
    : IFeatureHandler<GetUserRoleByIdRequest, UserRoleDto>
{
    public async Task<UserRoleDto> Handle(GetUserRoleByIdRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Getting UserRole with ID: {Id}", request.Id);

        var userRole = await repository.GetAll()
            .Include(ur => ur.Role)
            .Include(ur => ur.User)
            .FirstOrDefaultAsync(ur => ur.Id == request.Id, ct);

        if (userRole == null)
        {
            logger.LogWarning("UserRole with ID {Id} not found", request.Id);
            throw new KeyNotFoundException($"UserRole with ID {request.Id} not found");
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