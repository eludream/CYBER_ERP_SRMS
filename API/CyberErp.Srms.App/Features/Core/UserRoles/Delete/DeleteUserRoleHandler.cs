using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;
using CyberErp.Srms.App.Features.Core.UserRoles.Delete;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.UserRoles.Delete;

public class DeleteUserRoleHandler(
    IRepository<UserRole> repository,
    IUnitOfWork unitOfWork,
    ILogger<DeleteUserRoleHandler> logger)
    : IFeatureHandler<DeleteUserRoleRequest, DTOs.UserRoleResult?>
{
    public async Task<DTOs.UserRoleResult?> Handle(DeleteUserRoleRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Deleting UserRole with ID: {Id}", request.Id);

        var userRole = await repository.GetAll()
            .Where(ur => ur.Id == request.Id)
            .FirstOrDefaultAsync(ct);

        if (userRole == null)
        {
            logger.LogWarning("UserRole with ID {Id} not found", request.Id);
            return null;
        }

        repository.Delete(userRole);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("UserRole deleted with Id: {Id}", userRole.Id);

        return new DTOs.UserRoleResult
        {
            Id = userRole.Id,
            RoleId = userRole.RoleId,
            UserId = userRole.UserId,
            Role = string.Empty,
            User = string.Empty,
            CreatedBy = userRole.CreatedBy
        };
    }
}