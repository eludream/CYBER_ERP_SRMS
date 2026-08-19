using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.Extensions.Logging;
using CyberErp.Srms.App.Common.Services;

namespace CyberErp.Srms.App.Features.Core.Users.Create;

public record UserResult(Guid Id);

public class CreateUserHandler(
    IRepository<User> repository,
    IUnitOfWork unitOfWork,
    IValidator<CreateUserRequest> validator,
    IAuthentication authentication,
    ILogger<CreateUserHandler> logger)
    : IFeatureHandler<CreateUserRequest, UserResult>
{
    public async Task<UserResult> Handle(CreateUserRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var user = User.Create(
            request.FullName,
            request.Email,
            request.PhoneNumber,
            request.UserName,
            authentication.EncryptPassword(request.Password),
            request.EmployeeId);

        await repository.AddAsync(user);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("User created with Id: {Id}", user.Id);

        return new UserResult(user.Id);
    }
}
