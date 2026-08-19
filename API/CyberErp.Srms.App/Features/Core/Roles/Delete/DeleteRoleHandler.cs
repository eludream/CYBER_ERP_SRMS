using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Roles.Delete;

public record RoleResult(Guid Id);

public class DeleteRoleHandler(
    IRepository<Role> repository,
    IUnitOfWork unitOfWork,
    ILogger<DeleteRoleHandler> logger)
    : IFeatureHandler<DeleteRoleRequest, RoleResult>
{
    public async Task<RoleResult> Handle(DeleteRoleRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Deleting Role with Id: {Id}", request.Id);

        var role = await repository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (role == null)
        {
            logger.LogWarning("Role with Id: {Id} not found", request.Id);
            throw new NotFoundException(nameof(Role), request.Id.ToString());
        }

        repository.Delete(role);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Role deleted successfully with Id: {Id}", role.Id);

        return new RoleResult(role.Id);
    }
}