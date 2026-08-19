using CyberErp.Srms.App.Common.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CyberErp.Srms.Api.Controllers;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CyberErp.Srms.App.Features.Core.Settings.Create;
using CyberErp.Srms.App.Features.Core.Settings.Delete;
using CyberErp.Srms.App.Features.Core.Settings.DTOs;
using CyberErp.Srms.App.Features.Core.Settings.GetAll;
using CyberErp.Srms.App.Features.Core.Settings.GetById;
using CyberErp.Srms.App.Features.Core.Settings.Update;
using CyberErp.Srms.App.Common.Handlers;

namespace CyberErp.Srms.Api.Controllers.Core
{
    public class SettingController : BaseController
    {
        private readonly IFeatureHandler<CreateSettingRequest, CyberErp.Srms.App.Features.Core.Settings.Create.SettingResult> _createSetting;
        private readonly IFeatureHandler<UpdateSettingRequest, CyberErp.Srms.App.Features.Core.Settings.Update.SettingResult> _updateSetting;
        private readonly IFeatureHandler<DeleteSettingRequest, CyberErp.Srms.App.Features.Core.Settings.Delete.SettingResult> _deleteSetting;
        private readonly IFeatureHandler<GetAllSettingsRequest, PaginatedResponse<SettingDto>> _getAllSettings;
        private readonly IFeatureHandler<GetSettingByIdRequest, SettingDto> _getSettingById;

        public SettingController(
            IFeatureHandler<CreateSettingRequest, CyberErp.Srms.App.Features.Core.Settings.Create.SettingResult> createSetting,
            IFeatureHandler<UpdateSettingRequest, CyberErp.Srms.App.Features.Core.Settings.Update.SettingResult> updateSetting,
            IFeatureHandler<DeleteSettingRequest, CyberErp.Srms.App.Features.Core.Settings.Delete.SettingResult> deleteSetting,
            IFeatureHandler<GetAllSettingsRequest, PaginatedResponse<SettingDto>> getAllSettings,
            IFeatureHandler<GetSettingByIdRequest, SettingDto> getSettingById)
        {
            _createSetting = createSetting;
            _updateSetting = updateSetting;
            _deleteSetting = deleteSetting;
            _getAllSettings = getAllSettings;
            _getSettingById = getSettingById;
        }

        [HttpGet]
        public async Task<PaginatedResponse<SettingDto>> GetAll([FromQuery] GetAllSettingsRequest request, CancellationToken cancellationToken)
        {
            return await _getAllSettings.Handle(request, cancellationToken);
        }

        [HttpGet("{id}")]
        public async Task<SettingDto?> GetById(Guid id, CancellationToken cancellationToken)
        {
            return await _getSettingById.Handle(new GetSettingByIdRequest(id), cancellationToken);
        }

        [HttpPost]
        public async Task<CyberErp.Srms.App.Features.Core.Settings.Create.SettingResult> Create([FromBody] CreateSettingRequest dto, CancellationToken cancellationToken)
        {
            return await _createSetting.Handle(dto, cancellationToken);
        }

        [HttpPut]
        public async Task<CyberErp.Srms.App.Features.Core.Settings.Update.SettingResult> Update([FromBody] UpdateSettingRequest dto, CancellationToken cancellationToken)
        {
            return await _updateSetting.Handle(dto, cancellationToken);
        }

        [HttpDelete("{id}")]
        public async Task<CyberErp.Srms.App.Features.Core.Settings.Delete.SettingResult> Delete(Guid id, CancellationToken cancellationToken)
        {
            return await _deleteSetting.Handle(new DeleteSettingRequest(id), cancellationToken);
        }
    }
}