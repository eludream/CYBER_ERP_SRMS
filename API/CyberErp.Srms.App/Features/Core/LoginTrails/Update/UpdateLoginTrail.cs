using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.LoginTrails.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;

using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.LoginTrails.Update
{
    public class UpdateLoginTrail(
        IUpdateLoginTrailRepository LoginTrailRepository,
        IValidator<UpdateLoginTrailDto> validator,
        ILogger<UpdateLoginTrail> logger) : IUpdateLoginTrail
    {
        private readonly IUpdateLoginTrailRepository _LoginTrailRepository = LoginTrailRepository;
        private readonly IValidator<UpdateLoginTrailDto> _validator = validator;
        private readonly ILogger<UpdateLoginTrail> _logger = logger;

        public async Task<LoginTrailResult> UpdateAsync(UpdateLoginTrailDto dto)
        {
            _logger.LogInformation("Updating LoginTrail with IpAddress: {IpAddress}", dto.IpAddress);

            var validationResult = await _validator.ValidateAsync(dto);
            if (!validationResult.IsValid)
            {
                _logger.LogWarning("LoginTrail update failed validation for IpAddress: {IpAddress}", dto.IpAddress);
                throw new ValidationException(validationResult.Errors);
            }

            return await _LoginTrailRepository.UpdateAsync(dto);
        }
    }
}

