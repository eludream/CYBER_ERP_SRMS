using FluentValidation;
using CyberErp.Srms.App.Features.Core.Approvers.DTOs;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Approvers.Reject
{
    public class Reject(
        IRejectRepository repository,
        IValidator<RejectDto> validator,
        ILogger<Reject> logger) : IReject
    {
        private readonly IRejectRepository _repository = repository;
        private readonly IValidator<RejectDto> _validator = validator;
        private readonly ILogger<Reject> _logger = logger;

        public async Task RejectAsync(RejectDto dto)
        {
            _logger.LogInformation("Approving VoucherNumber {VoucherNumber}", dto.VoucherNumber);

            var validationResult = await _validator.ValidateAsync(dto);
            if (!validationResult.IsValid)
            {
                _logger.LogWarning("Approval validation failed for voucher {VoucherNumber}", dto.VoucherNumber);
                throw new ValidationException(validationResult.Errors);
            }

            await _repository.RejectAsync(dto);

            _logger.LogInformation("Approval completed for voucher {VoucherNumber}", dto.VoucherNumber);
        }
    }
}

