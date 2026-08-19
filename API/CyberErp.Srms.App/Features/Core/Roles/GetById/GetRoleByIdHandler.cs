using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.Roles.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Roles.GetById;

public class GetRoleByIdHandler(
    IRepository<Role> repository,
    ILogger<GetRoleByIdHandler> logger)
    : IFeatureHandler<GetRoleByIdRequest, RoleDto>
{
    public async Task<RoleDto> Handle(GetRoleByIdRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Getting Role with ID: {Id}", request.Id);

        var role = await repository.GetAll()
            .FirstOrDefaultAsync(r => r.Id == request.Id, ct);

        if (role == null)
        {
            logger.LogWarning("Role with ID {Id} not found", request.Id);
            throw new NotFoundException(nameof(Role), request.Id.ToString());
        }

        return new RoleDto
        {
            Id = role.Id,
            Name = role.Name,
            Code = role.Code
        };
    }
}