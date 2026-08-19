using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Roles.Update;

public record RoleResult(Guid Id);

public class UpdateRoleHandler(
    IRepository<Role> repository,
    IUnitOfWork unitOfWork,
    IValidator<UpdateRoleRequest> validator,
    ILogger<UpdateRoleHandler> logger)
    : IFeatureHandler<UpdateRoleRequest, RoleResult>
{
    public async Task<RoleResult> Handle(UpdateRoleRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var role = await repository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (role == null)
        {
            logger.LogWarning("Role with Id: {Id} not found", request.Id);
            throw new NotFoundException(nameof(Role), request.Id.ToString());
        }

        role.Update(request.Name, request.Code);

        repository.UpdateAsync(role);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Role updated with Id: {Id}", role.Id);

        return new RoleResult(role.Id);
    }
}