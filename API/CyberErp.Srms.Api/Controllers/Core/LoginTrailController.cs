using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CyberErp.Srms.Api.Controllers;
using CyberErp.Srms.App.Features.Core.LoginTrails.Create;
using CyberErp.Srms.App.Features.Core.LoginTrails.Update;
using CyberErp.Srms.App.Features.Core.LoginTrails.Delete;
using CyberErp.Srms.App.Features.Core.LoginTrails.GetAll;
using CyberErp.Srms.App.Features.Core.LoginTrails.GetById;
using CyberErp.Srms.App.Features.Core.LoginTrails.DTOs;
using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;

namespace CyberErp.Srms.Api.Controllers.Core
{
    public class LoginTrailController : BaseController
    {
        private readonly ICreateLoginTrail _createLoginTrail;
        private readonly IUpdateLoginTrail _updateLoginTrail;
        private readonly IDeleteLoginTrail _deleteLoginTrail;
        private readonly IFeatureHandler<GetAllRequest, PaginatedResponse<LoginTrailDto>> _getAllLoginTrails;
        private readonly IGetLoginTrailById _getLoginTrailById;

        public LoginTrailController(
            ICreateLoginTrail createLoginTrail,
            IUpdateLoginTrail updateLoginTrail,
            IDeleteLoginTrail deleteLoginTrail,
            IFeatureHandler<GetAllRequest, PaginatedResponse<LoginTrailDto>> getAllLoginTrails,
            IGetLoginTrailById getLoginTrailById)
        {
            _createLoginTrail = createLoginTrail;
            _updateLoginTrail = updateLoginTrail;
            _deleteLoginTrail = deleteLoginTrail;
            _getAllLoginTrails = getAllLoginTrails;
            _getLoginTrailById = getLoginTrailById;
        }

        [HttpGet]
        public async Task<PaginatedResponse<LoginTrailDto>> GetAll([FromQuery] GetAllRequest request)
        {
            return await _getAllLoginTrails.Handle(request);
        }

        [HttpGet("{id}")]
        public async Task<LoginTrailDto> GetById(Guid id)
        {
            return await _getLoginTrailById.GetByIdAsync(id);
        }

        [HttpPost]
        public async Task<LoginTrailResult> Create([FromBody] LoginTrailDto dto)
        {
            return await _createLoginTrail.CreateAsync(dto);
        }

        [HttpPut]
        public async Task<LoginTrailResult> Update([FromBody] UpdateLoginTrailDto dto)
        {
            return await _updateLoginTrail.UpdateAsync(dto);
        }

        [HttpDelete("{id}")]
        public async Task<LoginTrailResult> Delete(Guid id)
        {
            return await _deleteLoginTrail.DeleteAsync(id);
        }
    }
}