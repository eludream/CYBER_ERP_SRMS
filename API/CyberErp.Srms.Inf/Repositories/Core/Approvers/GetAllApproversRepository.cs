using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Approvers.GetAll;
using CyberErp.Srms.App.Features.Core.Approvers.DTOs;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace CyberErp.Srms.Inf.Repositories.Core.Approvers;

public class GetAllApproversRepository(
    IRepository<Approver> approversRepository,
    ILogger<GetAllApproversRepository> logger) : IGetAllApproversRepository
{
    private readonly IRepository<Approver> _approversRepository = approversRepository;
    private readonly ILogger<GetAllApproversRepository> _logger = logger;

    public async Task<PaginatedResponse<GetApproverDto>> GetAllAsync(GetAllApproversRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation("Getting all Approvers");

        var query = _approversRepository.GetAll();

        if (!string.IsNullOrWhiteSpace(request.SearchText))
        {
            query = query.Where(x => x.VoucherType.Contains(request.SearchText));
        }

        var totalCount = await query.CountAsync(ct);

        query = query.OrderByDescending(x => x.CreatedAt);

        var skip = int.Parse(request.Skip ?? "0");
        var take = int.Parse(request.Take ?? "10");

        var items = await query
            .Skip(skip)
            .Take(take)
            .Select(x => new GetApproverDto
            {
                Id = x.Id,
                VoucherType = x.VoucherType,
                ApproverId = x.ApproverId,
                StatusId = x.StatusId,
                Approver = x.ApproverUser.FullName,
                Status = x.Status.Name,
                Criteria = x.Criteria
            })
            .ToListAsync(ct);

        return new PaginatedResponse<GetApproverDto>
        {
            Total = totalCount,
            Data = items
        };
    }
}