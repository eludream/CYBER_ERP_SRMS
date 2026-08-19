using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.DocumentSettings.DTOs;
using CyberErp.Srms.App.Features.Core.DocumentSettings.GetAll;

namespace CyberErp.Srms.App.Features.Core.DocumentSettings.GetAll;

public class GetAllDocumentSettingsHandler(IGetAllDocumentSettingsRepository repository)
    : IFeatureHandler<GetAllDocumentSettingsRequest, PaginatedResponse<DocumentSettingDto>>
{
    public async Task<PaginatedResponse<DocumentSettingDto>> Handle(GetAllDocumentSettingsRequest request, CancellationToken ct = default)
    {
        return await repository.GetAllAsync(request, ct);
    }
}
