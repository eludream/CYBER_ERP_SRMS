using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CyberErp.Srms.Api.Controllers;
using CyberErp.Srms.App.Features.Core.VoucherTransactions.Create;
using CyberErp.Srms.App.Features.Core.VoucherTransactions.Update;
using CyberErp.Srms.App.Features.Core.VoucherTransactions.Delete;
using CyberErp.Srms.App.Features.Core.VoucherTransactions.GetAll;
using CyberErp.Srms.App.Features.Core.VoucherTransactions.GetById;
using CyberErp.Srms.App.Features.Core.VoucherTransactions.DTOs;
using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;

namespace CyberErp.Srms.Api.Controllers.Core
{
    public class VoucherTransactionController : BaseController
    {
        private readonly IFeatureHandler<CreateVoucherTransactionRequest, CyberErp.Srms.App.Features.Core.VoucherTransactions.Create.VoucherTransactionResult> _createVoucherTransaction;
        private readonly IFeatureHandler<UpdateVoucherTransactionRequest, CyberErp.Srms.App.Features.Core.VoucherTransactions.Update.VoucherTransactionResult> _updateVoucherTransaction;
        private readonly IFeatureHandler<DeleteVoucherTransactionRequest, CyberErp.Srms.App.Features.Core.VoucherTransactions.Delete.VoucherTransactionResult> _deleteVoucherTransaction;
        private readonly IFeatureHandler<GetAllVoucherTransactionsRequest, PaginatedResponse<GetVoucherTransactionDto>> _getAllVoucherTransactions;
        private readonly IFeatureHandler<GetVoucherTransactionByIdRequest, GetVoucherTransactionDto> _getVoucherTransactionById;

        public VoucherTransactionController(
            IFeatureHandler<CreateVoucherTransactionRequest, CyberErp.Srms.App.Features.Core.VoucherTransactions.Create.VoucherTransactionResult> createVoucherTransaction,
            IFeatureHandler<UpdateVoucherTransactionRequest, CyberErp.Srms.App.Features.Core.VoucherTransactions.Update.VoucherTransactionResult> updateVoucherTransaction,
            IFeatureHandler<DeleteVoucherTransactionRequest, CyberErp.Srms.App.Features.Core.VoucherTransactions.Delete.VoucherTransactionResult> deleteVoucherTransaction,
            IFeatureHandler<GetAllVoucherTransactionsRequest, PaginatedResponse<GetVoucherTransactionDto>> getAllVoucherTransactions,
            IFeatureHandler<GetVoucherTransactionByIdRequest, GetVoucherTransactionDto> getVoucherTransactionById)
        {
            _createVoucherTransaction = createVoucherTransaction;
            _updateVoucherTransaction = updateVoucherTransaction;
            _deleteVoucherTransaction = deleteVoucherTransaction;
            _getAllVoucherTransactions = getAllVoucherTransactions;
            _getVoucherTransactionById = getVoucherTransactionById;
        }

        [HttpGet]
        public async Task<PaginatedResponse<GetVoucherTransactionDto>> GetAll([FromQuery] GetAllVoucherTransactionsRequest request)
        {
            return await _getAllVoucherTransactions.Handle(request);
        }

        [HttpGet("{id}")]
        public async Task<GetVoucherTransactionDto> GetById(Guid id)
        {
            return await _getVoucherTransactionById.Handle(new GetVoucherTransactionByIdRequest(id));
        }

        [HttpPost]
        public async Task<CyberErp.Srms.App.Features.Core.VoucherTransactions.Create.VoucherTransactionResult> Create([FromBody] CreateVoucherTransactionRequest dto)
        {
            return await _createVoucherTransaction.Handle(dto);
        }

        [HttpPut]
        public async Task<CyberErp.Srms.App.Features.Core.VoucherTransactions.Update.VoucherTransactionResult> Update([FromBody] UpdateVoucherTransactionRequest dto)
        {
            return await _updateVoucherTransaction.Handle(dto);
        }

        [HttpDelete("{id}")]
        public async Task<CyberErp.Srms.App.Features.Core.VoucherTransactions.Delete.VoucherTransactionResult> Delete(Guid id)
        {
            return await _deleteVoucherTransaction.Handle(new DeleteVoucherTransactionRequest(id));
        }
    }
}