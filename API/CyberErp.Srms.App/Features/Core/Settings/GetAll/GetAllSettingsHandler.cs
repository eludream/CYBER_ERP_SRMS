using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.Settings.DTOs;
using CyberErp.Srms.App.Features.Core.Settings.GetAll;

namespace CyberErp.Srms.App.Features.Core.Settings.GetAll;

public class GetAllSettingsHandler(IGetAllSettingsRepository repository)
    : IFeatureHandler<GetAllSettingsRequest, PaginatedResponse<SettingDto>>
{
    public async Task<PaginatedResponse<SettingDto>> Handle(GetAllSettingsRequest request, CancellationToken ct = default)
    {
        return await repository.GetAllAsync(request, ct);
    }
}
