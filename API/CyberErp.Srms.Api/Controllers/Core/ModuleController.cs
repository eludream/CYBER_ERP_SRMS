using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CyberErp.Srms.Api.Controllers;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.Modules.Create;
using CyberErp.Srms.App.Features.Core.Modules.Update;
using CyberErp.Srms.App.Features.Core.Modules.Delete;
using CyberErp.Srms.App.Features.Core.Modules.GetAll;
using CyberErp.Srms.App.Features.Core.Modules.GetById;
using CyberErp.Srms.App.Features.Core.Modules.DTOs;
using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Modules.GetOperations;
using CyberErp.Srms.App.Features.Core.Modules.GetSystemResource;

namespace CyberErp.Srms.Api.Controllers.Core
{
    public class ModuleController : BaseController
    {
        private readonly IFeatureHandler<CreateModuleRequest, ModuleResult> _createHandler;
        private readonly IFeatureHandler<UpdateModuleRequest, ModuleResult> _updateHandler;
        private readonly IFeatureHandler<DeleteModuleRequest, ModuleResult?> _deleteHandler;
        private readonly IFeatureHandler<GetAllModulesRequest, PaginatedResponse<GetModuleDto>> _getAllHandler;
        private readonly IFeatureHandler<GetModuleByIdRequest, GetModuleDto?> _getByIdHandler;
        private readonly IFeatureHandler<GetModuleWithOperationsRequest, IEnumerable<GetModuleWithOperationResult>> _getWithOperationsHandler;
        private readonly IFeatureHandler<GetSystemResourceRequest, SystemResourceRouteDto?> _getSystemResourceHandler;

        public ModuleController(
            IFeatureHandler<CreateModuleRequest, ModuleResult> createHandler,
            IFeatureHandler<UpdateModuleRequest, ModuleResult> updateHandler,
            IFeatureHandler<DeleteModuleRequest, ModuleResult?> deleteHandler,
            IFeatureHandler<GetAllModulesRequest, PaginatedResponse<GetModuleDto>> getAllHandler,
            IFeatureHandler<GetModuleByIdRequest, GetModuleDto?> getByIdHandler,
            IFeatureHandler<GetModuleWithOperationsRequest, IEnumerable<GetModuleWithOperationResult>> getWithOperationsHandler,
            IFeatureHandler<GetSystemResourceRequest, SystemResourceRouteDto?> getSystemResourceHandler)
        {
            _createHandler = createHandler;
            _updateHandler = updateHandler;
            _deleteHandler = deleteHandler;
            _getAllHandler = getAllHandler;
            _getByIdHandler = getByIdHandler;
            _getWithOperationsHandler = getWithOperationsHandler;
            _getSystemResourceHandler = getSystemResourceHandler;
        }

        [AllowAnonymous]
        [HttpGet("system-resource")]
        public async Task<ActionResult<SystemResourceRouteDto>> GetSystemResource(CancellationToken ct)
        {
            var result = await _getSystemResourceHandler.Handle(new GetSystemResourceRequest(), ct);
            return result is null ? NotFound() : Ok(result);
        }

        [HttpGet]
        public async Task<PaginatedResponse<GetModuleDto>> GetAll([FromQuery] GetAllModulesRequest request)
        {
            return await _getAllHandler.Handle(request);
        }

        [HttpGet("WithOperations")]
        public async Task<IEnumerable<GetModuleWithOperationResult>> GetAllWithOperations([FromQuery] GetModuleWithOperationsRequest request)
        {
            return await _getWithOperationsHandler.Handle(request);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<GetModuleDto>> GetById(Guid id)
        {
            var result = await _getByIdHandler.Handle(new GetModuleByIdRequest(id));
            return result != null ? Ok(result) : NotFound();
        }

        [HttpPost]
        public async Task<ActionResult<ModuleResult>> Create([FromBody] CreateModuleRequest request)
        {
            var result = await _createHandler.Handle(request);
            return Ok(result);
        }

        [HttpPut]
        public async Task<ActionResult<ModuleResult>> Update([FromBody] UpdateModuleRequest request)
        {
            var result = await _updateHandler.Handle(request);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ModuleResult?>> Delete(Guid id)
        {
            var result = await _deleteHandler.Handle(new DeleteModuleRequest(id));
            return result != null ? Ok(result) : NotFound();
        }
    }
}