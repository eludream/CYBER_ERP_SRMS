using FluentValidation;
using CyberErp.Srms.App.Features.Core.Approvers.DTOs;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Approvers.Approve
{
    public class Approve(
        IApproveRepository repository,
        IValidator<ApproveDto> validator,
        ILogger<Approve> logger) : IApprove
    {
        private readonly IApproveRepository _repository = repository;
        private readonly IValidator<ApproveDto> _validator = validator;
        private readonly ILogger<Approve> _logger = logger;

        public async Task ApproveAsync(ApproveDto dto)
        {
            _logger.LogInformation("Approving voucher {VoucherNumber}", dto.VoucherNumber);

            var validationResult = await _validator.ValidateAsync(dto);
            if (!validationResult.IsValid)
            {
                _logger.LogWarning("Approval validation failed for voucher {VoucherNumber}", dto.VoucherNumber);
                throw new ValidationException(validationResult.Errors);
            }

            await _repository.ApproveAsync(dto);

            _logger.LogInformation("Approval completed for voucher {VoucherNumber}", dto.VoucherNumber);
        }
    }
}

