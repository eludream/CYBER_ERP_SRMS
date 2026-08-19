using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CyberErp.Srms.Api.Controllers;
using CyberErp.Srms.App.Features.Core.Notifications.Create;
using CyberErp.Srms.App.Features.Core.Notifications.Update;
using CyberErp.Srms.App.Features.Core.Notifications.Delete;
using CyberErp.Srms.App.Features.Core.Notifications.GetAll;
using CyberErp.Srms.App.Features.Core.Notifications.GetById;
using CyberErp.Srms.App.Features.Core.Notifications.DTOs;
using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;

namespace CyberErp.Srms.Api.Controllers.Core
{
    public class NotificationController : BaseController
    {
        private readonly IFeatureHandler<CreateNotificationRequest, CyberErp.Srms.App.Features.Core.Notifications.Create.NotificationResult> _createNotification;
        private readonly IFeatureHandler<UpdateNotificationRequest, CyberErp.Srms.App.Features.Core.Notifications.Update.NotificationResult> _updateNotification;
        private readonly IFeatureHandler<DeleteNotificationRequest, CyberErp.Srms.App.Features.Core.Notifications.Delete.NotificationResult> _deleteNotification;
        private readonly IFeatureHandler<GetAllNotificationsRequest, PaginatedResponse<GetNotificationDto>> _getAllNotifications;
        private readonly IFeatureHandler<GetNotificationByIdRequest, GetNotificationDto> _getNotificationById;

        public NotificationController(
            IFeatureHandler<CreateNotificationRequest, CyberErp.Srms.App.Features.Core.Notifications.Create.NotificationResult> createNotification,
            IFeatureHandler<UpdateNotificationRequest, CyberErp.Srms.App.Features.Core.Notifications.Update.NotificationResult> updateNotification,
            IFeatureHandler<DeleteNotificationRequest, CyberErp.Srms.App.Features.Core.Notifications.Delete.NotificationResult> deleteNotification,
            IFeatureHandler<GetAllNotificationsRequest, PaginatedResponse<GetNotificationDto>> getAllNotifications,
            IFeatureHandler<GetNotificationByIdRequest, GetNotificationDto> getNotificationById)
        {
            _createNotification = createNotification;
            _updateNotification = updateNotification;
            _deleteNotification = deleteNotification;
            _getAllNotifications = getAllNotifications;
            _getNotificationById = getNotificationById;
        }

        [HttpGet]
        public async Task<PaginatedResponse<GetNotificationDto>> GetAll([FromQuery] GetAllNotificationsRequest request)
        {
            return await _getAllNotifications.Handle(request);
        }

        [HttpGet("{id}")]
        public async Task<GetNotificationDto> GetById(Guid id)
        {
            return await _getNotificationById.Handle(new GetNotificationByIdRequest(id));
        }

        [HttpPost]
        public async Task<CyberErp.Srms.App.Features.Core.Notifications.Create.NotificationResult> Create([FromBody] CreateNotificationRequest dto)
        {
            return await _createNotification.Handle(dto);
        }

        [HttpPut]
        public async Task<CyberErp.Srms.App.Features.Core.Notifications.Update.NotificationResult> Update([FromBody] UpdateNotificationRequest dto)
        {
            return await _updateNotification.Handle(dto);
        }

        [HttpDelete("{id}")]
        public async Task<CyberErp.Srms.App.Features.Core.Notifications.Delete.NotificationResult> Delete(Guid id)
        {
            return await _deleteNotification.Handle(new DeleteNotificationRequest(id));
        }
    }
}