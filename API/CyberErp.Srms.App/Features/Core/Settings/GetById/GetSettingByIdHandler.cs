using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.Settings.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Settings.GetById;

public class GetSettingByIdHandler(
    IRepository<Setting> repository,
    ILogger<GetSettingByIdHandler> logger)
    : IFeatureHandler<GetSettingByIdRequest, SettingDto?>
{
    public async Task<SettingDto?> Handle(GetSettingByIdRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Getting Setting with ID: {Id}", request.Id);

        var setting = await repository.GetAll()
            .Where(x => x.Id == request.Id)
            .Select(x => new SettingDto
            {
                Id = x.Id,
                Type = x.Type,
                SettingKey = x.SettingKey,
                SettingValue = x.SettingValue,
                Description = x.Description
            })
            .FirstOrDefaultAsync(ct);

        if (setting == null)
        {
            logger.LogWarning("Setting with ID {Id} not found", request.Id);
            throw new NotFoundException(nameof(Setting), request.Id.ToString());
        }

        return setting;
    }
}