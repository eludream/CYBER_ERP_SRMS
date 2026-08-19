using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.Operations.Create;
using CyberErp.Srms.App.Features.Core.Operations.Update;
using CyberErp.Srms.App.Features.Core.Operations.Delete;
using CyberErp.Srms.App.Features.Core.Operations.GetAll;
using CyberErp.Srms.App.Features.Core.Operations.GetById;
using CyberErp.Srms.App.Features.Core.Operations.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CyberErp.Srms.Api.Controllers;
using CyberErp.Srms.App.Common.Services;
using System.Security.Claims;
using CyberErp.Srms.Inf.Models;
using Microsoft.EntityFrameworkCore;

namespace CyberErp.Srms.Api.Controllers.Core
{
    public class OperationController : BaseController
    {
        private readonly IFeatureHandler<CreateOperationRequest, OperationResult> _createHandler;
        private readonly IFeatureHandler<UpdateOperationRequest, OperationResult> _updateHandler;
        private readonly IFeatureHandler<DeleteOperationRequest, OperationResult?> _deleteHandler;
        private readonly IFeatureHandler<GetAllOperationsRequest, PaginatedResponse<OperationDto>> _getAllHandler;
        private readonly IFeatureHandler<GetOperationByIdRequest, OperationDto?> _getByIdHandler;
        private readonly IMultiTenantControlPlaneService _tenantControlPlane;
        private readonly SrmsDbContext _db;

        public OperationController(
            IFeatureHandler<CreateOperationRequest, OperationResult> createHandler,
            IFeatureHandler<UpdateOperationRequest, OperationResult> updateHandler,
            IFeatureHandler<DeleteOperationRequest, OperationResult?> deleteHandler,
            IFeatureHandler<GetAllOperationsRequest, PaginatedResponse<OperationDto>> getAllHandler,
            IFeatureHandler<GetOperationByIdRequest, OperationDto?> getByIdHandler,
            IMultiTenantControlPlaneService tenantControlPlane,
            SrmsDbContext db)
        {
            _createHandler = createHandler;
            _updateHandler = updateHandler;
            _deleteHandler = deleteHandler;
            _getAllHandler = getAllHandler;
            _getByIdHandler = getByIdHandler;
            _tenantControlPlane = tenantControlPlane;
            _db = db;
        }

        private Guid UserId => Guid.TryParse(User.FindFirstValue("UserId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : throw new UnauthorizedAccessException();
        private Guid TenantId => Guid.TryParse(User.FindFirstValue("TenantId"), out var id) && id != Guid.Empty ? id : throw new UnauthorizedAccessException("Select a tenant first.");

        [HttpGet]
        public async Task<PaginatedResponse<OperationDto>> GetAll([FromQuery] GetAllOperationsRequest request)
        {
            return await _getAllHandler.Handle(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<OperationDto>> GetById(Guid id)
        {
            var tenantId = TenantId;
            var result = await _db.TenantOperations.AsNoTracking()
                .Where(x => x.TenantModule.TenantId == tenantId && x.Id == id)
                .Select(x => new OperationDto
                {
                    Id = x.Id,
                    ModuleId = x.TenantModule.SubSystemId,
                    ParentOperationId = x.TenantModuleId,
                    Name = x.Name,
                    Module = x.TenantModule.SubSystem.Name,
                    Link = x.Link,
                    Filter = x.Filter,
                    Icon = x.Icon,
                    DisplayOrder = x.DisplayOrder,
                    IsActive = x.IsActive
                })
                .SingleOrDefaultAsync();
            return result != null ? Ok(result) : NotFound();
        }

        [HttpGet("tenant-assignments")]
        public async Task<IReadOnlyList<TenantOperationDto>> TenantAssignments(CancellationToken ct) =>
            await _tenantControlPlane.GetTenantOperationsAsync(UserId, TenantId, ct);

        [HttpPut("{operationId:guid}/tenant-state")]
        public async Task<TenantOperationDto> SetTenantState(Guid operationId, [FromBody] TenantOperationState request, CancellationToken ct) =>
            await _tenantControlPlane.SetTenantOperationActiveAsync(UserId, TenantId, operationId, request.IsActive, ct);

        [HttpPost]
        public async Task<ActionResult<OperationResult>> Create([FromBody] CreateOperationRequest request)
        {
            if (!request.ParentOperationId.HasValue)
                return BadRequest(new { message = "A module is required for an operation." });

            var created = await _tenantControlPlane.CreateTenantOperationAsync(
                UserId, TenantId, request.ModuleId, request.ParentOperationId.Value,
                new(request.Name, request.Link, request.Filter, request.Icon, request.ParentOperationId, request.DisplayOrder, request.IsActive),
                HttpContext.RequestAborted);
            return Ok(new OperationResult
            {
                Id = created.Id,
                ModuleId = created.ModuleId,
                ParentOperationId = created.ParentOperationId,
                Name = created.Name,
                Link = created.Link,
                Filter = created.Filter,
                Icon = created.Icon,
                DisplayOrder = created.DisplayOrder,
                IsActive = created.IsActive
            });
        }

        [HttpPut]
        public async Task<ActionResult<OperationResult>> Update([FromBody] UpdateOperationRequest request)
        {
            var tenantId = TenantId;
            var operation = await _db.TenantOperations.SingleOrDefaultAsync(
                x => x.TenantModule.TenantId == tenantId
                    && x.TenantModule.SubSystemId == request.ModuleId
                    && x.Id == request.Id,
                HttpContext.RequestAborted);
            if (operation is null) return NotFound();

            // This both validates tenant-administrator access and updates only the
            // selected tenant's operation state.
            await _tenantControlPlane.SetTenantOperationActiveAsync(
                UserId, tenantId, operation.Id, request.IsActive, HttpContext.RequestAborted);

            var displayOrder = operation.TenantModuleId == request.ParentOperationId
                ? request.DisplayOrder
                : (await _db.TenantOperations.AsNoTracking()
                    .Where(x => x.TenantModule.TenantId == tenantId
                        && x.TenantModule.SubSystemId == request.ModuleId
                        && x.TenantModuleId == request.ParentOperationId
                        && x.Id != request.Id)
                    .Select(x => x.DisplayOrder)
                    .ToListAsync(HttpContext.RequestAborted))
                    .DefaultIfEmpty(0).Max() + 1;

            operation.Update(
                request.Name,
                request.Link,
                request.Filter,
                request.Icon,
                request.ParentOperationId!.Value,
                displayOrder,
                request.IsActive);
            await _db.SaveChangesAsync(HttpContext.RequestAborted);

            var result = new OperationResult
            {
                Id = operation.Id,
                ModuleId = request.ModuleId,
                ParentOperationId = operation.TenantModuleId,
                Name = operation.Name,
                Link = operation.Link,
                Filter = operation.Filter,
                Icon = operation.Icon,
                DisplayOrder = operation.DisplayOrder,
                IsActive = operation.IsActive
            };
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            await _tenantControlPlane.DeleteTenantOperationAsync(UserId, TenantId, id, HttpContext.RequestAborted);
            return NoContent();
        }

        public sealed record TenantOperationState(bool IsActive);
    }
}
