using System.Security.Claims;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.Dom.Entities.Core;
using CyberErp.Srms.Inf.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CyberErp.Srms.Api.Controllers.Core;

[ApiController]
[Authorize]
[Route("api/v1.0/lookup-categories")]
public sealed class LookupCategoryController(SrmsDbContext db, IMultiTenantControlPlaneService controlPlane) : ControllerBase
{
    private Guid UserId => Guid.TryParse(User.FindFirstValue("UserId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
        ? id : throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) => Ok(await db.LookupCategories.AsNoTracking()
        .OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name)
        .Select(x => new LookupCategoryDto(x.Id, x.Code, x.Name, x.DisplayOrder,
            x.Items.OrderBy(item => item.DisplayOrder).ThenBy(item => item.Name)
                .Select(item => new LookupCategoryItemDto(item.Id, item.CategoryId, item.Code, item.Name, item.DisplayOrder)).ToList()))
        .ToListAsync(ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await db.LookupCategories.AsNoTracking().Where(x => x.Id == id)
            .Select(x => new LookupCategoryDto(x.Id, x.Code, x.Name, x.DisplayOrder,
                x.Items.OrderBy(item => item.DisplayOrder).ThenBy(item => item.Name)
                    .Select(item => new LookupCategoryItemDto(item.Id, item.CategoryId, item.Code, item.Name, item.DisplayOrder)).ToList()))
            .SingleOrDefaultAsync(ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(LookupWriteDto dto, CancellationToken ct)
    {
        await controlPlane.EnsurePlatformAdministratorAsync(UserId, ct);
        if (await db.LookupCategories.AnyAsync(x => x.Code == dto.Code.Trim(), ct)) return Conflict(new { message = "Lookup category code already exists." });
        var entity = LookupCategory.Create(dto.Code, dto.Name, dto.DisplayOrder);
        db.LookupCategories.Add(entity); await db.SaveChangesAsync(ct);
        return Ok(new { entity.Id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, LookupWriteDto dto, CancellationToken ct)
    {
        await controlPlane.EnsurePlatformAdministratorAsync(UserId, ct);
        var entity = await db.LookupCategories.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return NotFound();
        if (await db.LookupCategories.AnyAsync(x => x.Id != id && x.Code == dto.Code.Trim(), ct)) return Conflict(new { message = "Lookup category code already exists." });
        entity.Update(dto.Code, dto.Name, dto.DisplayOrder); await db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await controlPlane.EnsurePlatformAdministratorAsync(UserId, ct);
        var entity = await db.LookupCategories.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return NotFound();
        if (await db.LookupCategoryItems.AnyAsync(x => x.CategoryId == id, ct)) return Conflict(new { message = "Delete the category items first." });
        db.LookupCategories.Remove(entity); await db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpPost("{categoryId:guid}/items")]
    public async Task<IActionResult> CreateItem(Guid categoryId, LookupWriteDto dto, CancellationToken ct)
    {
        await controlPlane.EnsurePlatformAdministratorAsync(UserId, ct);
        if (!await db.LookupCategories.AnyAsync(x => x.Id == categoryId, ct)) return NotFound();
        if (await db.LookupCategoryItems.AnyAsync(x => x.CategoryId == categoryId && x.Code == dto.Code.Trim(), ct)) return Conflict(new { message = "Lookup item code already exists in this category." });
        var entity = LookupCategoryItem.Create(categoryId, dto.Code, dto.Name, dto.DisplayOrder);
        db.LookupCategoryItems.Add(entity); await db.SaveChangesAsync(ct); return Ok(new { entity.Id });
    }

    [HttpPut("{categoryId:guid}/items/{id:guid}")]
    public async Task<IActionResult> UpdateItem(Guid categoryId, Guid id, LookupWriteDto dto, CancellationToken ct)
    {
        await controlPlane.EnsurePlatformAdministratorAsync(UserId, ct);
        var entity = await db.LookupCategoryItems.SingleOrDefaultAsync(x => x.Id == id && x.CategoryId == categoryId, ct);
        if (entity is null) return NotFound();
        if (await db.LookupCategoryItems.AnyAsync(x => x.Id != id && x.CategoryId == categoryId && x.Code == dto.Code.Trim(), ct)) return Conflict(new { message = "Lookup item code already exists in this category." });
        entity.Update(dto.Code, dto.Name, dto.DisplayOrder); await db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpDelete("{categoryId:guid}/items/{id:guid}")]
    public async Task<IActionResult> DeleteItem(Guid categoryId, Guid id, CancellationToken ct)
    {
        await controlPlane.EnsurePlatformAdministratorAsync(UserId, ct);
        var entity = await db.LookupCategoryItems.SingleOrDefaultAsync(x => x.Id == id && x.CategoryId == categoryId, ct);
        if (entity is null) return NotFound();
        if (await db.Tenant.AnyAsync(x => x.TenantTypeId == id, ct)) return Conflict(new { message = "The lookup item is assigned to a tenant." });
        db.LookupCategoryItems.Remove(entity); await db.SaveChangesAsync(ct); return NoContent();
    }
}

public sealed record LookupWriteDto(string Code, string Name, int DisplayOrder);
public sealed record LookupCategoryItemDto(Guid Id, Guid CategoryId, string Code, string Name, int DisplayOrder);
public sealed record LookupCategoryDto(Guid Id, string Code, string Name, int DisplayOrder, IReadOnlyList<LookupCategoryItemDto> Items);
