using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.VoucherTransactions.DTOs;
using CyberErp.Srms.App.Features.Core.VoucherTransactions.GetAll;

namespace CyberErp.Srms.App.Features.Core.VoucherTransactions.GetAll
{
    public interface IGetAllVoucherTransactionsRepository
    {
        Task<PaginatedResponse<GetVoucherTransactionDto>> GetAllAsync(GetAllVoucherTransactionsRequest request, CancellationToken ct = default);
    }
}
