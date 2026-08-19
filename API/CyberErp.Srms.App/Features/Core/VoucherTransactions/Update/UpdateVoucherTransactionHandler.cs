using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.VoucherTransactions.Update;

public record VoucherTransactionResult(Guid Id);

public class UpdateVoucherTransactionHandler(
    IRepository<VoucherTransaction> repository,
    IUnitOfWork unitOfWork,
    IValidator<UpdateVoucherTransactionRequest> validator,
    ILogger<UpdateVoucherTransactionHandler> logger)
    : IFeatureHandler<UpdateVoucherTransactionRequest, VoucherTransactionResult>
{
    public async Task<VoucherTransactionResult> Handle(UpdateVoucherTransactionRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var voucherTransaction = await repository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (voucherTransaction == null)
        {
            logger.LogWarning("VoucherTransaction with Id: {Id} not found", request.Id);
            throw new NotFoundException(nameof(VoucherTransaction), request.Id.ToString());
        }

        voucherTransaction.Update(
            request.VoucherType,
            request.ApproverId,
            request.VoucherId,
            request.StatusId,
            request.VoucherNumber,
            request.Date);

        repository.UpdateAsync(voucherTransaction);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("VoucherTransaction updated with Id: {Id}", voucherTransaction.Id);

        return new VoucherTransactionResult(voucherTransaction.Id);
    }
}