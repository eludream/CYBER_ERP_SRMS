
using CyberErp.Srms.App.Features.Core.LoginTrails.DTOs;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.LoginTrails.Create
{
    public class CreateLoginTrail(
        ICreateLoginTrailRepository repository,
        IValidator<LoginTrailDto> validator,
        ILogger<CreateLoginTrail> logger) : ICreateLoginTrail
    {
        private readonly ICreateLoginTrailRepository _repository = repository;
        private readonly IValidator<LoginTrailDto> _validator = validator;
        private readonly ILogger<CreateLoginTrail> _logger = logger;

        public async Task<LoginTrailResult> CreateAsync(LoginTrailDto dto)
        {
            _logger.LogInformation("Creating LoginTrail with IpAddress: {IpAddress}", dto.IpAddress);

            var validationResult = await _validator.ValidateAsync(dto);
            if (!validationResult.IsValid)
            {
                _logger.LogWarning("LoginTrail creation failed validation for IpAddress: {IpAddress}", dto.IpAddress);
                throw new ValidationException(validationResult.Errors);
            }

            return await _repository.CreateAsync(dto);
        }
    }
}

