using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CyberErp.Srms.Api.Controllers;
using CyberErp.Srms.App.Features.Core.UserRoles.Create;
using CyberErp.Srms.App.Features.Core.UserRoles.Update;
using CyberErp.Srms.App.Features.Core.UserRoles.Delete;
using CyberErp.Srms.App.Features.Core.UserRoles.GetAll;
using CyberErp.Srms.App.Features.Core.UserRoles.GetById;
using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;
using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;

namespace CyberErp.Srms.Api.Controllers.Core
{
    public class UserRoleController : BaseController
    {
        private readonly IFeatureHandler<GetAllUserRolesRequest, PaginatedResponse<UserRoleResult>> _getAllUserRoles;
        private readonly IFeatureHandler<GetUserRoleByIdRequest, UserRoleDto> _getUserRoleById;
        private readonly IFeatureHandler<CreateUserRoleRequest, UserRoleResult> _createUserRole;
        private readonly IFeatureHandler<UpdateUserRoleRequest, UserRoleResult> _updateUserRole;
        private readonly IFeatureHandler<DeleteUserRoleRequest, UserRoleResult?> _deleteUserRole;

        public UserRoleController(
            IFeatureHandler<GetAllUserRolesRequest, PaginatedResponse<UserRoleResult>> getAllUserRoles,
            IFeatureHandler<GetUserRoleByIdRequest, UserRoleDto> getUserRoleById,
            IFeatureHandler<CreateUserRoleRequest, UserRoleResult> createUserRole,
            IFeatureHandler<UpdateUserRoleRequest, UserRoleResult> updateUserRole,
            IFeatureHandler<DeleteUserRoleRequest, UserRoleResult?> deleteUserRole)
        {
            _getAllUserRoles = getAllUserRoles;
            _getUserRoleById = getUserRoleById;
            _createUserRole = createUserRole;
            _updateUserRole = updateUserRole;
            _deleteUserRole = deleteUserRole;
        }

        [HttpGet]
        public async Task<PaginatedResponse<UserRoleResult>> GetAll([FromQuery] GetAllUserRolesRequest request)
        {
            return await _getAllUserRoles.Handle(request);
        }

        [HttpGet("{id}")]
        public async Task<UserRoleDto> GetById(Guid id)
        {
            return await _getUserRoleById.Handle(new GetUserRoleByIdRequest { Id = id });
        }

        [HttpPost]
        public async Task<UserRoleResult> Create([FromBody] UserRoleDto dto)
        {
            return await _createUserRole.Handle(new CreateUserRoleRequest(dto.RoleId, dto.UserId));
        }

        [HttpPut]
        public async Task<UserRoleResult> Update([FromBody] UserRoleDto dto)
        {
            return await _updateUserRole.Handle(new UpdateUserRoleRequest(dto.Id, dto.RoleId, dto.UserId, null));
        }

        [HttpDelete("{id}")]
        public async Task<UserRoleResult?> Delete(Guid id)
        {
            return await _deleteUserRole.Handle(new DeleteUserRoleRequest(id));
        }
    }
}
