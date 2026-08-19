using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CyberErp.Srms.Api.Controllers;
using CyberErp.Srms.App.Features.Core.Tenants.Create;
using CyberErp.Srms.App.Features.Core.Tenants.Update;
using CyberErp.Srms.App.Features.Core.Tenants.Delete;
using CyberErp.Srms.App.Features.Core.Tenants.GetById;
using CyberErp.Srms.App.Features.Core.Tenants.DTOs;
using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.Tenants.GetAll;

namespace CyberErp.Srms.Api.Controllers.Core
{
    public class TenantController : BaseController
    {
        private readonly IFeatureHandler<CreateTenantRequest, CyberErp.Srms.App.Features.Core.Tenants.Create.TenantResult> _createTenant;
        private readonly IFeatureHandler<UpdateTenantRequest, CyberErp.Srms.App.Features.Core.Tenants.Update.TenantResult> _updateTenant;
        private readonly IFeatureHandler<DeleteTenantRequest, CyberErp.Srms.App.Features.Core.Tenants.Delete.TenantResult> _deleteTenant;
        private readonly IFeatureHandler<GetAllTenantsRequest, PaginatedResponse<TenantDto>> _getAllTenants;
        private readonly IFeatureHandler<GetTenantByIdRequest, TenantDto?> _getTenantById;

        public TenantController(
            IFeatureHandler<CreateTenantRequest, CyberErp.Srms.App.Features.Core.Tenants.Create.TenantResult> createTenant,
            IFeatureHandler<UpdateTenantRequest, CyberErp.Srms.App.Features.Core.Tenants.Update.TenantResult> updateTenant,
            IFeatureHandler<DeleteTenantRequest, CyberErp.Srms.App.Features.Core.Tenants.Delete.TenantResult> deleteTenant,
            IFeatureHandler<GetAllTenantsRequest, PaginatedResponse<TenantDto>> getAllTenants,
            IFeatureHandler<GetTenantByIdRequest, TenantDto?> getTenantById)
        {
            _createTenant = createTenant;
            _updateTenant = updateTenant;
            _deleteTenant = deleteTenant;
            _getAllTenants = getAllTenants;
            _getTenantById = getTenantById;
        }

        [HttpGet]
        public async Task<PaginatedResponse<TenantDto>> GetAll([FromQuery] GetAllTenantsRequest request)
        {
            return await _getAllTenants.Handle(request);
        }

        [HttpGet("{id}")]
        public async Task<TenantDto?> GetById(Guid id)
        {
            return await _getTenantById.Handle(new GetTenantByIdRequest(id));
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<CyberErp.Srms.App.Features.Core.Tenants.Create.TenantResult> Create([FromBody] CreateTenantRequest dto)
        {
            return await _createTenant.Handle(dto);
        }

        [HttpPut]
        public async Task<CyberErp.Srms.App.Features.Core.Tenants.Update.TenantResult> Update([FromBody] UpdateTenantRequest dto)
        {
            return await _updateTenant.Handle(dto);
        }

        [HttpDelete("{id}")]
        public async Task<CyberErp.Srms.App.Features.Core.Tenants.Delete.TenantResult> Delete(Guid id)
        {
            return await _deleteTenant.Handle(new DeleteTenantRequest(id));
        }
    }
}