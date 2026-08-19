using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Notifications.DTOs;
using CyberErp.Srms.App.Features.Core.Notifications.GetAll;

namespace CyberErp.Srms.App.Features.Core.Notifications.GetAll
{
    public interface IGetAllNotificationsRepository
    {
        Task<PaginatedResponse<GetNotificationDto>> GetAllAsync(GetAllNotificationsRequest request, CancellationToken ct = default);
    }
}
