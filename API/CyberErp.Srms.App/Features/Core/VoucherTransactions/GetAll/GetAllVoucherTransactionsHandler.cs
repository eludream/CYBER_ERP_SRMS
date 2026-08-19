using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.VoucherTransactions.DTOs;
using CyberErp.Srms.App.Features.Core.VoucherTransactions.GetAll;

namespace CyberErp.Srms.App.Features.Core.VoucherTransactions.GetAll;

public class GetAllVoucherTransactionsHandler(IGetAllVoucherTransactionsRepository repository)
    : IFeatureHandler<GetAllVoucherTransactionsRequest, PaginatedResponse<GetVoucherTransactionDto>>
{
    public async Task<PaginatedResponse<GetVoucherTransactionDto>> Handle(GetAllVoucherTransactionsRequest request, CancellationToken ct = default)
    {
        return await repository.GetAllAsync(request, ct);
    }
}
