using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Users.Delete;

public record UserResult(Guid Id);

public class DeleteUserHandler(
    IRepository<User> repository,
    IUnitOfWork unitOfWork,
    ILogger<DeleteUserHandler> logger)
    : IFeatureHandler<DeleteUserRequest, UserResult>
{
    public async Task<UserResult> Handle(DeleteUserRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Deleting User with Id: {Id}", request.Id);

        var user = await repository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (user == null)
        {
            logger.LogWarning("User with Id: {Id} not found", request.Id);
            throw new NotFoundException(nameof(User), request.Id.ToString());
        }

        repository.Delete(user);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("User deleted successfully with Id: {Id}", user.Id);

        return new UserResult(user.Id);
    }
}