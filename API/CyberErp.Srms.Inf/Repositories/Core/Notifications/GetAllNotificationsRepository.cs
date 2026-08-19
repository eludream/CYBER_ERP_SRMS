using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Notifications.DTOs;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Notifications.GetAll;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace CyberErp.Srms.Inf.Repositories.Core.Notifications;

public class GetAllNotificationsRepository(
    IRepository<Notification> notificationsRepository,
    ILogger<GetAllNotificationsRepository> logger) : IGetAllNotificationsRepository
{
    private readonly IRepository<Notification> _notificationsRepository = notificationsRepository;
    private readonly ILogger<GetAllNotificationsRepository> _logger = logger;

    public async Task<PaginatedResponse<GetNotificationDto>> GetAllAsync(GetAllNotificationsRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation("Getting all Notifications");

        var query = _notificationsRepository.GetAll();

        if (!string.IsNullOrWhiteSpace(request.SearchText))
        {
            var searchLower = request.SearchText.ToLower();
            query = query.Where(n => n.VoucherType.ToLower().Contains(searchLower) ||
                                     n.VoucherNumber.ToLower().Contains(searchLower));
        }

        var totalCount = await query.CountAsync(ct);

        query = query.OrderByDescending(x => x.CreatedAt);

        var skip = int.Parse(request.Skip ?? "0");
        var take = int.Parse(request.Take ?? "10");

        var items = await query
            .Skip(skip)
            .Take(take)
            .Select(n => new GetNotificationDto
            {
                Id = n.Id,
                VoucherType = n.VoucherType,
                ApproverId = n.ApproverId,
                VoucherId = n.VoucherId,
                VoucherNumber = n.VoucherNumber,
                Date = n.Date,
                Criteria = n.Criteria,
                Approver = n.Approver != null ? n.Approver.FullName : string.Empty,
                Status = n.Status != null ? n.Status.Name : string.Empty,
                IsResponded = n.IsResponded,
                IsEmailed = n.IsEmailed,
                IsViewed = n.IsViewed,
                IsSms = n.IsSms,
                StatusId = n.StatusId,
                Message = n.Message
            })
            .ToListAsync(ct);

        return new PaginatedResponse<GetNotificationDto>
        {
            Total = totalCount,
            Data = items
        };
    }
}