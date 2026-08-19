using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.DocumentSettings.DTOs;
using CyberErp.Srms.App.Features.Core.DocumentSettings.GetAll;

namespace CyberErp.Srms.App.Features.Core.DocumentSettings.GetAll
{
    public interface IGetAllDocumentSettingsRepository
    {
        Task<PaginatedResponse<DocumentSettingDto>> GetAllAsync(GetAllDocumentSettingsRequest request, CancellationToken ct = default);
    }
}
