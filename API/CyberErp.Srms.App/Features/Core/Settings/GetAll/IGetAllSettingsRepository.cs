using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Settings.DTOs;
using CyberErp.Srms.App.Features.Core.Settings.GetAll;

namespace CyberErp.Srms.App.Features.Core.Settings.GetAll
{
    public interface IGetAllSettingsRepository
    {
        Task<PaginatedResponse<SettingDto>> GetAllAsync(GetAllSettingsRequest request, CancellationToken ct = default);
    }
}
