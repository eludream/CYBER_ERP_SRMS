using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;
using CyberErp.Srms.App.Features.Core.UserRoles.Create;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.UserRoles.Create;

public class CreateUserRoleHandler(
    IRepository<UserRole> repository,
    IUnitOfWork unitOfWork,
    IValidator<CreateUserRoleRequest> validator,
    ILogger<CreateUserRoleHandler> logger)
    : IFeatureHandler<CreateUserRoleRequest, DTOs.UserRoleResult>
{
    public async Task<DTOs.UserRoleResult> Handle(CreateUserRoleRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new ValidationException(validationResult.Errors);

        var userRole = UserRole.Create(request.RoleId, request.UserId);
        
        await repository.AddAsync(userRole);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("UserRole created with Id: {Id}", userRole.Id);

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
