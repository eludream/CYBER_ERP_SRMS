using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.VoucherTransactions.DTOs;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.VoucherTransactions.GetAll;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace CyberErp.Srms.Inf.Repositories.Core.VoucherTransactions;

public class GetAllVoucherTransactionsRepository(
    IRepository<VoucherTransaction> voucherTransactionsRepository,
    ILogger<GetAllVoucherTransactionsRepository> logger) : IGetAllVoucherTransactionsRepository
{
    private readonly IRepository<VoucherTransaction> _voucherTransactionsRepository = voucherTransactionsRepository;
    private readonly ILogger<GetAllVoucherTransactionsRepository> _logger = logger;

    public async Task<PaginatedResponse<GetVoucherTransactionDto>> GetAllAsync(GetAllVoucherTransactionsRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation("Getting all VoucherTransactions");

        var query = _voucherTransactionsRepository.GetAll();

        if (!string.IsNullOrWhiteSpace(request.SearchText))
        {
            query = query.Where(x => x.VoucherNumber.Contains(request.SearchText));
        }

        var totalCount = await query.CountAsync(ct);

        query = query.OrderByDescending(x => x.CreatedAt);

        var skip = int.Parse(request.Skip ?? "0");
        var take = int.Parse(request.Take ?? "10");

        var items = await query
            .Skip(skip)
            .Take(take)
            .Select(x => new GetVoucherTransactionDto
            {
                Id = x.Id,
                VoucherType = x.VoucherType,
                ApproverId = x.ApproverId,
                StatusId = x.StatusId,
                VoucherId = x.VoucherId,
                VoucherNumber = x.VoucherNumber,
                Date = x.Date,
                Status = x.Status != null ? x.Status.Name : string.Empty,
                Approver = x.Approver != null ? x.Approver.UserName : string.Empty
            })
            .ToListAsync(ct);

        return new PaginatedResponse<GetVoucherTransactionDto>
        {
            Total = totalCount,
            Data = items
        };
    }
}