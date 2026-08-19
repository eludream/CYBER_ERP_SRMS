using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Roles.Create;

public record RoleResult(Guid Id);

public class CreateRoleHandler(
    IRepository<Role> repository,
    IUnitOfWork unitOfWork,
    IValidator<CreateRoleRequest> validator,
    ILogger<CreateRoleHandler> logger)
    : IFeatureHandler<CreateRoleRequest, RoleResult>
{
    public async Task<RoleResult> Handle(CreateRoleRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var role = Role.Create(
            request.Name,
            request.Code);

        await repository.AddAsync(role);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Role created with Id: {Id}", role.Id);

        return new RoleResult(role.Id);
    }
}