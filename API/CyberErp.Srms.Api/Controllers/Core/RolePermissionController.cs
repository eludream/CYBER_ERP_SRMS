using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CyberErp.Srms.Api.Controllers;
using CyberErp.Srms.App.Features.Core.RolePermissions.Create;
using CyberErp.Srms.App.Features.Core.RolePermissions.Update;
using CyberErp.Srms.App.Features.Core.RolePermissions.Delete;
using CyberErp.Srms.App.Features.Core.RolePermissions.GetAll;
using CyberErp.Srms.App.Features.Core.RolePermissions.GetById;
using CyberErp.Srms.App.Features.Core.RolePermissions.DTOs;
using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;

namespace CyberErp.Srms.Api.Controllers.Core
{
    public class RolePermissionController : BaseController
    {
        private readonly IFeatureHandler<CreateRolePermissionRequest, CyberErp.Srms.App.Features.Core.RolePermissions.Create.RolePermissionResult> _createRolePermission;
        private readonly IFeatureHandler<CreateRolePermissionBulkRequest, CyberErp.Srms.App.Features.Core.RolePermissions.Create.RolePermissionBulkResult> _createRolePermissionBulk;
        private readonly IFeatureHandler<UpdateRolePermissionRequest, CyberErp.Srms.App.Features.Core.RolePermissions.Update.RolePermissionResult> _updateRolePermission;
        private readonly IFeatureHandler<DeleteRolePermissionRequest, CyberErp.Srms.App.Features.Core.RolePermissions.Delete.RolePermissionResult> _deleteRolePermission;
        private readonly IFeatureHandler<GetAllRolePermissionsRequest, PaginatedResponse<RolePermissionDto>> _getAllRolePermissions;
        private readonly IFeatureHandler<GetRolePermissionByIdRequest, RolePermissionDto> _getRolePermissionById;

        public RolePermissionController(
            IFeatureHandler<CreateRolePermissionRequest, CyberErp.Srms.App.Features.Core.RolePermissions.Create.RolePermissionResult> createRolePermission,
            IFeatureHandler<CreateRolePermissionBulkRequest, CyberErp.Srms.App.Features.Core.RolePermissions.Create.RolePermissionBulkResult> createRolePermissionBulk,
            IFeatureHandler<UpdateRolePermissionRequest, CyberErp.Srms.App.Features.Core.RolePermissions.Update.RolePermissionResult> updateRolePermission,
            IFeatureHandler<DeleteRolePermissionRequest, CyberErp.Srms.App.Features.Core.RolePermissions.Delete.RolePermissionResult> deleteRolePermission,
            IFeatureHandler<GetAllRolePermissionsRequest, PaginatedResponse<RolePermissionDto>> getAllRolePermissions,
            IFeatureHandler<GetRolePermissionByIdRequest, RolePermissionDto> getRolePermissionById)
        {
            _createRolePermission = createRolePermission;
            _createRolePermissionBulk = createRolePermissionBulk;
            _updateRolePermission = updateRolePermission;
            _deleteRolePermission = deleteRolePermission;
            _getAllRolePermissions = getAllRolePermissions;
            _getRolePermissionById = getRolePermissionById;
        }

        [HttpGet]
        public async Task<PaginatedResponse<RolePermissionDto>> GetAll([FromQuery] GetAllRolePermissionsRequest request)
        {
            return await _getAllRolePermissions.Handle(request);
        }

        [HttpGet("{id}")]
        public async Task<RolePermissionDto> GetById(Guid id)
        {
            return await _getRolePermissionById.Handle(new GetRolePermissionByIdRequest(id));
        }

        [HttpPost]
        public async Task<CyberErp.Srms.App.Features.Core.RolePermissions.Create.RolePermissionResult> Create([FromBody] CreateRolePermissionRequest dto)
        {
            return await _createRolePermission.Handle(dto);
        }

        [HttpPost("bulk")]
        public async Task<CyberErp.Srms.App.Features.Core.RolePermissions.Create.RolePermissionBulkResult> CreateBulk([FromBody] CreateRolePermissionBulkRequest dto)
        {
            return await _createRolePermissionBulk.Handle(dto);
        }

        [HttpPut]
        public async Task<CyberErp.Srms.App.Features.Core.RolePermissions.Update.RolePermissionResult> Update([FromBody] UpdateRolePermissionRequest dto)
        {
            return await _updateRolePermission.Handle(dto);
        }

        [HttpDelete("{id}")]
        public async Task<CyberErp.Srms.App.Features.Core.RolePermissions.Delete.RolePermissionResult> Delete(Guid id)
        {
            return await _deleteRolePermission.Handle(new DeleteRolePermissionRequest(id));
        }
    }
}