using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.VoucherTransactions.Create;

public record VoucherTransactionResult(Guid Id);

public class CreateVoucherTransactionHandler(
    IRepository<VoucherTransaction> repository,
    IUnitOfWork unitOfWork,
    IValidator<CreateVoucherTransactionRequest> validator,
    ILogger<CreateVoucherTransactionHandler> logger)
    : IFeatureHandler<CreateVoucherTransactionRequest, VoucherTransactionResult>
{
    public async Task<VoucherTransactionResult> Handle(CreateVoucherTransactionRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var voucherTransaction = VoucherTransaction.Create(
            request.VoucherType,
            request.ApproverId,
            request.VoucherId,
            request.StatusId,
            request.VoucherNumber,
            request.Date);

        await repository.AddAsync(voucherTransaction);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("VoucherTransaction created with Id: {Id}", voucherTransaction.Id);

        return new VoucherTransactionResult(voucherTransaction.Id);
    }
}