using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;
using CyberErp.Srms.App.Features.Core.UserRoles.Update;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.UserRoles.Update;

public class UpdateUserRoleHandler(
    IRepository<UserRole> repository,
    IUnitOfWork unitOfWork,
    IValidator<UpdateUserRoleRequest> validator,
    ILogger<UpdateUserRoleHandler> logger)
    : IFeatureHandler<UpdateUserRoleRequest, DTOs.UserRoleResult>
{
    public async Task<DTOs.UserRoleResult> Handle(UpdateUserRoleRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new ValidationException(validationResult.Errors);

        var userRole = await repository.GetAll()
            .Where(ur => ur.Id == request.Id)
            .FirstOrDefaultAsync(ct);

        if (userRole == null)
        {
            logger.LogWarning("UserRole with ID {Id} not found", request.Id);
            throw new KeyNotFoundException($"UserRole with ID {request.Id} not found");
        }

        userRole.Update(request.RoleId, request.UserId);

        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("UserRole updated with Id: {Id}", userRole.Id);

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