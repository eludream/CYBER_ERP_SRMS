using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CyberErp.Srms.Api.Controllers;
using CyberErp.Srms.App.Features.Core.Roles.Create;
using CyberErp.Srms.App.Features.Core.Roles.Update;
using CyberErp.Srms.App.Features.Core.Roles.Delete;
using CyberErp.Srms.App.Features.Core.Roles.GetAll;
using CyberErp.Srms.App.Features.Core.Roles.GetById;
using CyberErp.Srms.App.Features.Core.Roles.DTOs;
using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;

namespace CyberErp.Srms.Api.Controllers.Core
{
    public class RoleController : BaseController
    {
        private readonly IFeatureHandler<CreateRoleRequest, CyberErp.Srms.App.Features.Core.Roles.Create.RoleResult> _createRole;
        private readonly IFeatureHandler<UpdateRoleRequest, CyberErp.Srms.App.Features.Core.Roles.Update.RoleResult> _updateRole;
        private readonly IFeatureHandler<DeleteRoleRequest, CyberErp.Srms.App.Features.Core.Roles.Delete.RoleResult> _deleteRole;
        private readonly IFeatureHandler<GetAllRolesRequest, PaginatedResponse<RoleDto>> _getAllRoles;
        private readonly IFeatureHandler<GetRoleByIdRequest, RoleDto> _getRoleById;

        public RoleController(
            IFeatureHandler<CreateRoleRequest, CyberErp.Srms.App.Features.Core.Roles.Create.RoleResult> createRole,
            IFeatureHandler<UpdateRoleRequest, CyberErp.Srms.App.Features.Core.Roles.Update.RoleResult> updateRole,
            IFeatureHandler<DeleteRoleRequest, CyberErp.Srms.App.Features.Core.Roles.Delete.RoleResult> deleteRole,
            IFeatureHandler<GetAllRolesRequest, PaginatedResponse<RoleDto>> getAllRoles,
            IFeatureHandler<GetRoleByIdRequest, RoleDto> getRoleById)
        {
            _createRole = createRole;
            _updateRole = updateRole;
            _deleteRole = deleteRole;
            _getAllRoles = getAllRoles;
            _getRoleById = getRoleById;
        }

        [HttpGet]
        public async Task<PaginatedResponse<RoleDto>> GetAll([FromQuery] GetAllRolesRequest request)
        {
            return await _getAllRoles.Handle(request);
        }

        [HttpGet("{id}")]
        public async Task<RoleDto> GetById(Guid id)
        {
            return await _getRoleById.Handle(new GetRoleByIdRequest(id));
        }

        [HttpPost]
        public async Task<CyberErp.Srms.App.Features.Core.Roles.Create.RoleResult> Create([FromBody] CreateRoleRequest dto)
        {
            return await _createRole.Handle(dto);
        }

        [HttpPut]
        public async Task<CyberErp.Srms.App.Features.Core.Roles.Update.RoleResult> Update([FromBody] UpdateRoleRequest dto)
        {
            return await _updateRole.Handle(dto);
        }

        [HttpDelete("{id}")]
        public async Task<CyberErp.Srms.App.Features.Core.Roles.Delete.RoleResult> Delete(Guid id)
        {
            return await _deleteRole.Handle(new DeleteRoleRequest(id));
        }
    }
}