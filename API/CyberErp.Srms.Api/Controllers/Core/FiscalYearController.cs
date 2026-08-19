using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CyberErp.Srms.Api.Controllers;
using CyberErp.Srms.App.Features.Core.FiscalYears.Create;
using CyberErp.Srms.App.Features.Core.FiscalYears.Update;
using CyberErp.Srms.App.Features.Core.FiscalYears.Delete;
using CyberErp.Srms.App.Features.Core.FiscalYears.GetAll;
using CyberErp.Srms.App.Features.Core.FiscalYears.GetById;
using CyberErp.Srms.App.Features.Core.FiscalYears.DTOs;
using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;

namespace CyberErp.Srms.Api.Controllers.Core
{
    public class FiscalYearController : BaseController
    {
        private readonly IFeatureHandler<CreateFiscalYearRequest, FiscalYearDto> _createFiscalYear;
        private readonly IFeatureHandler<UpdateFiscalYearRequest, FiscalYearDto> _updateFiscalYear;
        private readonly IFeatureHandler<DeleteFiscalYearRequest, FiscalYearDto> _deleteFiscalYear;
        private readonly IFeatureHandler<GetAllFiscalYearsRequest, PaginatedResponse<FiscalYearDto>> _getAllFiscalYears;
        private readonly IFeatureHandler<GetFiscalYearByIdRequest, FiscalYearDto> _getFiscalYearById;

        public FiscalYearController(
            IFeatureHandler<CreateFiscalYearRequest, FiscalYearDto> createFiscalYear,
            IFeatureHandler<UpdateFiscalYearRequest, FiscalYearDto> updateFiscalYear,
            IFeatureHandler<DeleteFiscalYearRequest, FiscalYearDto> deleteFiscalYear,
            IFeatureHandler<GetAllFiscalYearsRequest, PaginatedResponse<FiscalYearDto>> getAllFiscalYears,
            IFeatureHandler<GetFiscalYearByIdRequest, FiscalYearDto> getFiscalYearById)
        {
            _createFiscalYear = createFiscalYear;
            _updateFiscalYear = updateFiscalYear;
            _deleteFiscalYear = deleteFiscalYear;
            _getAllFiscalYears = getAllFiscalYears;
            _getFiscalYearById = getFiscalYearById;
        }

        [HttpGet]
        public async Task<PaginatedResponse<FiscalYearDto>> GetAll([FromQuery] GetAllFiscalYearsRequest request)
        {
            return await _getAllFiscalYears.Handle(request);
        }

        [HttpGet("{id}")]
        public async Task<FiscalYearDto> GetById(Guid id)
        {
            return await _getFiscalYearById.Handle(new GetFiscalYearByIdRequest(id));
        }

        [HttpPost]
        public async Task<FiscalYearDto> Create([FromBody] CreateFiscalYearRequest dto)
        {
            return await _createFiscalYear.Handle(dto);
        }

        [HttpPut]
        public async Task<FiscalYearDto> Update([FromBody] UpdateFiscalYearRequest dto)
        {
            return await _updateFiscalYear.Handle(dto);
        }

        [HttpDelete("{id}")]
        public async Task<FiscalYearDto> Delete(Guid id)
        {
            return await _deleteFiscalYear.Handle(new DeleteFiscalYearRequest(id));
        }
    }
}