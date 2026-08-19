using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.Notifications.DTOs;
using CyberErp.Srms.App.Features.Core.Notifications.GetAll;

namespace CyberErp.Srms.App.Features.Core.Notifications.GetAll;

public class GetAllNotificationsHandler(IGetAllNotificationsRepository repository)
    : IFeatureHandler<GetAllNotificationsRequest, PaginatedResponse<GetNotificationDto>>
{
    public async Task<PaginatedResponse<GetNotificationDto>> Handle(GetAllNotificationsRequest request, CancellationToken ct = default)
    {
        return await repository.GetAllAsync(request, ct);
    }
}
