using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.Users.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Users.GetById;

public class GetUserByIdHandler(
    IRepository<User> repository,
    ILogger<GetUserByIdHandler> logger)
    : IFeatureHandler<GetUserByIdRequest, UserDto>
{
    public async Task<UserDto> Handle(GetUserByIdRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Getting User with ID: {Id}", request.Id);

        var user = await repository.GetAll()
            .FirstOrDefaultAsync(u => u.Id == request.Id, ct);

        if (user == null)
        {
            logger.LogWarning("User with ID {Id} not found", request.Id);
            throw new NotFoundException(nameof(User), request.Id.ToString());
        }

        return new UserDto
        {
            Id = user.Id,
            EmployeeId = user.EmployeeId,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            UserName = user.UserName
        };
    }
}
