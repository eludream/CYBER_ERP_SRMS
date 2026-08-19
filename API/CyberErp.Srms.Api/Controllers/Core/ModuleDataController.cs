using System.Text.Json;
using CyberErp.Srms.Api.Controllers;
using CyberErp.Srms.Dom.Entities.Core;
using CyberErp.Srms.Inf.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CyberErp.Srms.Api.Controllers.Core;

public class ModuleDataController(SrmsDbContext db) : BaseController
{
    private string TenantId => User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenant_id")?.Value ?? string.Empty;

    [HttpGet]
    public async Task<IReadOnlyList<ModuleDataDto>> GetAll(CancellationToken ct) =>
        await db.ModuleDataSet.AsNoTracking()
            .Where(x => x.TenantId == TenantId)
            .OrderBy(x => x.Name)
            .Select(x => new ModuleDataDto(x.Name, x.PayloadJson))
            .ToListAsync(ct);

    [HttpPost("seed")]
    public async Task<IReadOnlyList<ModuleDataDto>> Seed([FromBody] IReadOnlyList<ModuleDataDto> dataSets, CancellationToken ct)
    {
        var tenantId = TenantId;
        var existingNames = await db.ModuleDataSet.Where(x => x.TenantId == tenantId).Select(x => x.Name).ToListAsync(ct);
        foreach (var item in dataSets.Where(x => !existingNames.Contains(x.Name, StringComparer.OrdinalIgnoreCase)))
        {
            EnsureValidJson(item.PayloadJson);
            db.ModuleDataSet.Add(ModuleDataSet.Create(item.Name, item.PayloadJson, tenantId));
        }
        await db.SaveChangesAsync(ct);
        return await GetAll(ct);
    }

    [HttpPut("{name}")]
    public async Task<IActionResult> Update(string name, [FromBody] ModuleDataDto request, CancellationToken ct)
    {
        EnsureValidJson(request.PayloadJson);
        var dataSet = await db.ModuleDataSet.FirstOrDefaultAsync(x => x.TenantId == TenantId && x.Name == name, ct);
        if (dataSet is null) return NotFound();
        dataSet.UpdatePayload(request.PayloadJson);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static void EnsureValidJson(string json)
    {
        try { using var _ = JsonDocument.Parse(json); }
        catch (JsonException) { throw new ArgumentException("PayloadJson must contain valid JSON."); }
    }
}

public record ModuleDataDto(string Name, string PayloadJson);
