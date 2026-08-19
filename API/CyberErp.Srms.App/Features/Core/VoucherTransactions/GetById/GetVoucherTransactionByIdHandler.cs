using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.VoucherTransactions.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.VoucherTransactions.GetById;

public class GetVoucherTransactionByIdHandler(
    IRepository<VoucherTransaction> repository,
    ILogger<GetVoucherTransactionByIdHandler> logger)
    : IFeatureHandler<GetVoucherTransactionByIdRequest, GetVoucherTransactionDto>
{
    public async Task<GetVoucherTransactionDto> Handle(GetVoucherTransactionByIdRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Getting VoucherTransaction with ID: {Id}", request.Id);

        var voucherTransaction = await repository.GetAll()
            .Where(x => x.Id == request.Id)
            .Select(x => new GetVoucherTransactionDto
            {
                Id = x.Id,
                VoucherType = x.VoucherType,
                ApproverId = x.ApproverId,
                VoucherId = x.VoucherId,
                StatusId = x.StatusId,
                VoucherNumber = x.VoucherNumber,
                Date = x.Date,
                Status = x.Status != null ? x.Status.Name : string.Empty,
                Approver = x.Approver != null ? x.Approver.UserName : string.Empty
            })
            .FirstOrDefaultAsync(ct);

        if (voucherTransaction == null)
        {
            logger.LogWarning("VoucherTransaction with ID: {Id} not found", request.Id);
            throw new NotFoundException(nameof(VoucherTransaction), request.Id.ToString());
        }

        return voucherTransaction;
    }
}