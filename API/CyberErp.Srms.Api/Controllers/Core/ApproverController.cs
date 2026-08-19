using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.Approvers.Create;
using CyberErp.Srms.App.Features.Core.Approvers.Update;
using CyberErp.Srms.App.Features.Core.Approvers.Delete;
using CyberErp.Srms.App.Features.Core.Approvers.GetAll;
using CyberErp.Srms.App.Features.Core.Approvers.GetById;
using CyberErp.Srms.App.Features.Core.Approvers.DTOs;
using CyberErp.Srms.App.Features.Core.Approvers.Approve;
using CyberErp.Srms.App.Features.Core.Approvers.Reject;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CyberErp.Srms.Api.Controllers;

namespace CyberErp.Srms.Api.Controllers.Core
{
    public class ApproverController : BaseController
    {
        private readonly IFeatureHandler<CreateApproverRequest, ApproverResult> _createHandler;
        private readonly IFeatureHandler<UpdateApproverRequest, ApproverResult> _updateHandler;
        private readonly IFeatureHandler<DeleteApproverRequest, ApproverResult?> _deleteHandler;
        private readonly IFeatureHandler<GetAllApproversRequest, PaginatedResponse<GetApproverDto>> _getAllHandler;
        private readonly IFeatureHandler<GetApproverByIdRequest, GetApproverDto?> _getByIdHandler;
        private readonly IApprove _approve;
        private readonly IReject _reject;

        public ApproverController(
            IFeatureHandler<CreateApproverRequest, ApproverResult> createHandler,
            IFeatureHandler<UpdateApproverRequest, ApproverResult> updateHandler,
            IFeatureHandler<DeleteApproverRequest, ApproverResult?> deleteHandler,
            IFeatureHandler<GetAllApproversRequest, PaginatedResponse<GetApproverDto>> getAllHandler,
            IFeatureHandler<GetApproverByIdRequest, GetApproverDto?> getByIdHandler,
            IApprove approve,
            IReject reject)
        {
            _createHandler = createHandler;
            _updateHandler = updateHandler;
            _deleteHandler = deleteHandler;
            _getAllHandler = getAllHandler;
            _getByIdHandler = getByIdHandler;
            _approve = approve;
            _reject = reject;
        }

        [HttpGet]
        public async Task<PaginatedResponse<GetApproverDto>> GetAll([FromQuery] GetAllApproversRequest request)
        {
            return await _getAllHandler.Handle(request);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<GetApproverDto>> GetById(Guid id)
        {
            var result = await _getByIdHandler.Handle(new GetApproverByIdRequest(id));
            return result != null ? Ok(result) : NotFound();
        }

        [HttpPost]
        public async Task<ActionResult<ApproverResult>> Create([FromBody] CreateApproverRequest request)
        {
            var result = await _createHandler.Handle(request);
            return Ok(result);
        }

        [HttpPut]
        public async Task<ActionResult<ApproverResult>> Update([FromBody] UpdateApproverRequest request)
        {
            var result = await _updateHandler.Handle(request);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApproverResult?>> Delete(Guid id)
        {
            var result = await _deleteHandler.Handle(new DeleteApproverRequest(id));
            return result != null ? Ok(result) : NotFound();
        }
    }
}