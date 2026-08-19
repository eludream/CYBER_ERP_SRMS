using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.VoucherTransactions.Delete;

public record VoucherTransactionResult(Guid Id);

public class DeleteVoucherTransactionHandler(
    IRepository<VoucherTransaction> repository,
    IUnitOfWork unitOfWork,
    ILogger<DeleteVoucherTransactionHandler> logger)
    : IFeatureHandler<DeleteVoucherTransactionRequest, VoucherTransactionResult>
{
    public async Task<VoucherTransactionResult> Handle(DeleteVoucherTransactionRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Deleting VoucherTransaction with Id: {Id}", request.Id);

        var voucherTransaction = await repository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (voucherTransaction == null)
        {
            logger.LogWarning("VoucherTransaction with Id: {Id} not found", request.Id);
            throw new NotFoundException(nameof(VoucherTransaction), request.Id.ToString());
        }

        repository.Delete(voucherTransaction);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("VoucherTransaction deleted successfully with Id: {Id}", voucherTransaction.Id);

        return new VoucherTransactionResult(voucherTransaction.Id);
    }
}