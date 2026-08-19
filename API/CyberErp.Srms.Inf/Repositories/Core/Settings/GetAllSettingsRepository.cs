using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Settings.DTOs;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Settings.GetAll;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace CyberErp.Srms.Inf.Repositories.Core.Settings;

public class GetAllSettingsRepository(
    IRepository<Setting> settingsRepository,
    ILogger<GetAllSettingsRepository> logger) : IGetAllSettingsRepository
{
    private readonly IRepository<Setting> _settingsRepository = settingsRepository;
    private readonly ILogger<GetAllSettingsRepository> _logger = logger;

    public async Task<PaginatedResponse<SettingDto>> GetAllAsync(GetAllSettingsRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation("Getting all Settings");

        var query = _settingsRepository.GetAll();

        if (!string.IsNullOrWhiteSpace(request.SearchText))
        {
            var searchLower = request.SearchText.ToLower();
            query = query.Where(x => x.SettingKey != null && x.SettingKey.ToLower().Contains(searchLower));
        }

        var totalCount = await query.CountAsync(ct);

        query = query.OrderByDescending(x => x.CreatedAt);

        var skip = int.Parse(request.Skip ?? "0");
        var take = int.Parse(request.Take ?? "10");

        var items = await query
            .Skip(skip)
            .Take(take)
            .Select(x => new SettingDto
            {
                Id = x.Id,
                Type = x.Type,
                SettingKey = x.SettingKey,
                SettingValue = x.SettingValue,
                Description = x.Description
            })
            .ToListAsync(ct);

        return new PaginatedResponse<SettingDto>
        {
            Total = totalCount,
            Data = items
        };
    }
}