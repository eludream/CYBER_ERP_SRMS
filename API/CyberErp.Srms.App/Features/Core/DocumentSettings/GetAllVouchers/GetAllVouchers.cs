
using CyberErp.Srms.Dom.Constants;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.DocumentSettings.GetAllVouchers
{
    public class GetAllVouchers(
        ILogger<GetAllVouchers> logger) : IGetAllVouchers
    {
         private readonly ILogger<GetAllVouchers> _logger = logger;

        public async Task<List<object>> GetAllAsync()
        {
            var vouchers = new List<string>
            {
                VoucherDocument.Issue,
                VoucherDocument.PurchaseOrder,
                VoucherDocument.TransferIssue,
                VoucherDocument.Transfer,
                VoucherDocument.StoreRequisition,
                VoucherDocument.TransferReceive,

                VoucherDocument.Receive,
                VoucherDocument.Adjustment,
                VoucherDocument.Return,
                VoucherDocument.BankTransfer,
                VoucherDocument.Collection,
                VoucherDocument.Payment,
                VoucherDocument.Expense,
                VoucherDocument.SalesOrder,
                VoucherDocument.Delivery,
                VoucherDocument.BankOpening,
                VoucherDocument.InventoryOpening,
                VoucherDocument.CustomerOpening,
                VoucherDocument.SupplierOpening,
            };
            return vouchers.Cast<object>().ToList();
        }
    }
}

