using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.DocumentSettings.DTOs;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.DocumentSettings.GetAll;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace CyberErp.Srms.Inf.Repositories.Core.DocumentSettings;

public class GetAllDocumentSettingsRepository(
    IRepository<DocumentSetting> documentSettingsRepository,
    ILogger<GetAllDocumentSettingsRepository> logger) : IGetAllDocumentSettingsRepository
{
    private readonly IRepository<DocumentSetting> _documentSettingsRepository = documentSettingsRepository;
    private readonly ILogger<GetAllDocumentSettingsRepository> _logger = logger;

    public async Task<PaginatedResponse<DocumentSettingDto>> GetAllAsync(GetAllDocumentSettingsRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation("Getting all DocumentSettings");

        var query = _documentSettingsRepository.GetAll();

        if (!string.IsNullOrWhiteSpace(request.SearchText))
        {
            var searchLower = request.SearchText.ToLower();
            query = query.Where(d => d.VoucherType.ToLower().Contains(searchLower));
        }

        var totalCount = await query.CountAsync(ct);

        query = query.OrderByDescending(x => x.CreatedAt);

        var skip = int.Parse(request.Skip ?? "0");
        var take = int.Parse(request.Take ?? "10");

        var items = await query
            .Skip(skip)
            .Take(take)
            .Select(d => new DocumentSettingDto
            {
                Id = d.Id,
                VoucherType = d.VoucherType,
                Prefix = d.Prefix,
                Sufix = d.Sufix,
                Year = d.Year,
                LastNumber = d.LastNumber
            })
            .ToListAsync(ct);

        return new PaginatedResponse<DocumentSettingDto>
        {
            Total = totalCount,
            Data = items
        };
    }
}