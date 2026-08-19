using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CyberErp.Srms.Api.Controllers;
using CyberErp.Srms.App.Features.Core.DocumentSettings.Create;
using CyberErp.Srms.App.Features.Core.DocumentSettings.Update;
using CyberErp.Srms.App.Features.Core.DocumentSettings.Delete;
using CyberErp.Srms.App.Features.Core.DocumentSettings.GetAll;
using CyberErp.Srms.App.Features.Core.DocumentSettings.GetById;
using CyberErp.Srms.App.Features.Core.DocumentSettings.DTOs;
using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;

namespace CyberErp.Srms.Api.Controllers.Core
{
    public class DocumentSettingController : BaseController
    {
        private readonly IFeatureHandler<CreateDocumentSettingRequest, CyberErp.Srms.App.Features.Core.DocumentSettings.Create.DocumentSettingResult> _createDocumentSetting;
        private readonly IFeatureHandler<UpdateDocumentSettingRequest, CyberErp.Srms.App.Features.Core.DocumentSettings.Update.DocumentSettingResult> _updateDocumentSetting;
        private readonly IFeatureHandler<DeleteDocumentSettingRequest, CyberErp.Srms.App.Features.Core.DocumentSettings.Delete.DocumentSettingResult> _deleteDocumentSetting;
        private readonly IFeatureHandler<GetAllDocumentSettingsRequest, PaginatedResponse<DocumentSettingDto>> _getAllDocumentSettings;
        private readonly IFeatureHandler<GetDocumentSettingByIdRequest, DocumentSettingDto> _getDocumentSettingById;

        public DocumentSettingController(
            IFeatureHandler<CreateDocumentSettingRequest, CyberErp.Srms.App.Features.Core.DocumentSettings.Create.DocumentSettingResult> createDocumentSetting,
            IFeatureHandler<UpdateDocumentSettingRequest, CyberErp.Srms.App.Features.Core.DocumentSettings.Update.DocumentSettingResult> updateDocumentSetting,
            IFeatureHandler<DeleteDocumentSettingRequest, CyberErp.Srms.App.Features.Core.DocumentSettings.Delete.DocumentSettingResult> deleteDocumentSetting,
            IFeatureHandler<GetAllDocumentSettingsRequest, PaginatedResponse<DocumentSettingDto>> getAllDocumentSettings,
            IFeatureHandler<GetDocumentSettingByIdRequest, DocumentSettingDto> getDocumentSettingById)
        {
            _createDocumentSetting = createDocumentSetting;
            _updateDocumentSetting = updateDocumentSetting;
            _deleteDocumentSetting = deleteDocumentSetting;
            _getAllDocumentSettings = getAllDocumentSettings;
            _getDocumentSettingById = getDocumentSettingById;
        }

        [HttpGet]
        public async Task<PaginatedResponse<DocumentSettingDto>> GetAll([FromQuery] GetAllDocumentSettingsRequest request)
        {
            return await _getAllDocumentSettings.Handle(request);
        }

        [HttpGet("{id}")]
        public async Task<DocumentSettingDto> GetById(Guid id)
        {
            return await _getDocumentSettingById.Handle(new GetDocumentSettingByIdRequest(id));
        }

        [HttpPost]
        public async Task<CyberErp.Srms.App.Features.Core.DocumentSettings.Create.DocumentSettingResult> Create([FromBody] CreateDocumentSettingRequest dto)
        {
            return await _createDocumentSetting.Handle(dto);
        }

        [HttpPut]
        public async Task<CyberErp.Srms.App.Features.Core.DocumentSettings.Update.DocumentSettingResult> Update([FromBody] UpdateDocumentSettingRequest dto)
        {
            return await _updateDocumentSetting.Handle(dto);
        }

        [HttpDelete("{id}")]
        public async Task<CyberErp.Srms.App.Features.Core.DocumentSettings.Delete.DocumentSettingResult> Delete(Guid id)
        {
            return await _deleteDocumentSetting.Handle(new DeleteDocumentSettingRequest(id));
        }
    }
}