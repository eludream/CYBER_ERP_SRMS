using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.Workflows.Create;
using CyberErp.Srms.App.Features.Core.Workflows.Update;
using CyberErp.Srms.App.Features.Core.Workflows.Delete;
using CyberErp.Srms.App.Features.Core.Workflows.GetAll;
using CyberErp.Srms.App.Features.Core.Workflows.GetById;
using CyberErp.Srms.App.Features.Core.Workflows.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CyberErp.Srms.Api.Controllers;

namespace CyberErp.Srms.Api.Controllers.Core
{
    public class WorkflowController : BaseController
    {
        private readonly IFeatureHandler<CreateWorkflowRequest, WorkflowResult> _createHandler;
        private readonly IFeatureHandler<UpdateWorkflowRequest, WorkflowResult> _updateHandler;
        private readonly IFeatureHandler<DeleteWorkflowRequest, WorkflowResult?> _deleteHandler;
        private readonly IFeatureHandler<GetAllWorkflowsRequest, PaginatedResponse<WorkflowDto>> _getAllHandler;
        private readonly IFeatureHandler<GetWorkflowByIdRequest, WorkflowDto?> _getByIdHandler;

        public WorkflowController(
            IFeatureHandler<CreateWorkflowRequest, WorkflowResult> createHandler,
            IFeatureHandler<UpdateWorkflowRequest, WorkflowResult> updateHandler,
            IFeatureHandler<DeleteWorkflowRequest, WorkflowResult?> deleteHandler,
            IFeatureHandler<GetAllWorkflowsRequest, PaginatedResponse<WorkflowDto>> getAllHandler,
            IFeatureHandler<GetWorkflowByIdRequest, WorkflowDto?> getByIdHandler)
        {
            _createHandler = createHandler;
            _updateHandler = updateHandler;
            _deleteHandler = deleteHandler;
            _getAllHandler = getAllHandler;
            _getByIdHandler = getByIdHandler;
        }

        [HttpGet]
        public async Task<PaginatedResponse<WorkflowDto>> GetAll([FromQuery] GetAllWorkflowsRequest request)
        {
            return await _getAllHandler.Handle(request);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<WorkflowDto>> GetById(Guid id)
        {
            var result = await _getByIdHandler.Handle(new GetWorkflowByIdRequest(id));
            return result != null ? Ok(result) : NotFound();
        }

        [HttpPost]
        public async Task<ActionResult<WorkflowResult>> Create([FromBody] CreateWorkflowRequest request)
        {
            var result = await _createHandler.Handle(request);
            return Ok(result);
        }

        [HttpPut]
        public async Task<ActionResult<WorkflowResult>> Update([FromBody] UpdateWorkflowRequest request)
        {
            var result = await _updateHandler.Handle(request);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<WorkflowResult?>> Delete(Guid id)
        {
            var result = await _deleteHandler.Handle(new DeleteWorkflowRequest(id));
            return result != null ? Ok(result) : NotFound();
        }
    }
}