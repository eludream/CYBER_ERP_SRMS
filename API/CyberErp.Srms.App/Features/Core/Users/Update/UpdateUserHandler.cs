using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Users.Update;

public record UserResult(Guid Id);

public class UpdateUserHandler(
    IRepository<User> repository,
    IUnitOfWork unitOfWork,
    IValidator<UpdateUserRequest> validator,
    ILogger<UpdateUserHandler> logger)
    : IFeatureHandler<UpdateUserRequest, UserResult>
{
    public async Task<UserResult> Handle(UpdateUserRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var user = await repository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (user == null)
        {
            logger.LogWarning("User with Id: {Id} not found", request.Id);
            throw new NotFoundException(nameof(User), request.Id.ToString());
        }

        user.Update(
            request.FullName,
            request.Email,
            request.PhoneNumber,
            request.UserName,
            request.EmployeeId);

        repository.UpdateAsync(user);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("User updated with Id: {Id}", user.Id);

        return new UserResult(user.Id);
    }
}
