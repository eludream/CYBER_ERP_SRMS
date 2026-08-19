using FluentValidation;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.App.Features.Core.SubscriptionPlans.DTOs;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.SubscriptionPlans.Create
{
    public class CreateSubscriptionPlan(
        ICreateSubscriptionPlanRepository repository,
        IValidator<CreateSubscriptionPlanDto> validator,
        IAuthentication authentication,
        ILogger<CreateSubscriptionPlan> logger) : ICreateSubscriptionPlan
    {
        private readonly ICreateSubscriptionPlanRepository _repository = repository;
        private readonly IValidator<CreateSubscriptionPlanDto> _validator = validator;
        private readonly IAuthentication _authentication = authentication;
        private readonly ILogger<CreateSubscriptionPlan> _logger = logger;

        public async Task<SubscriptionPlanResult> CreateAsync(CreateSubscriptionPlanDto dto)
        {
            _logger.LogInformation("Creating SubscriptionPlan with Name: {Name}", dto.Name);

            var validationResult = await _validator.ValidateAsync(dto);
            if (!validationResult.IsValid)
            {
                _logger.LogWarning("SubscriptionPlan creation failed validation for Name: {Name}", dto.Name);
                throw new FluentValidation.ValidationException(validationResult.Errors);
            }

            var result = await _repository.CreateAsync(dto);

            _logger.LogInformation("SubscriptionPlan created successfully with ID: {Id}", result.Id);

            return result;
        }
    }
}
