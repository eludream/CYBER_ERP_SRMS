using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.SubscriptionPlans.Create;
using CyberErp.Srms.App.Features.Core.SubscriptionPlans.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.Inf.Repositories.Core.SubscriptionPlans
{
    public class CreateSubscriptionPlanRepository(
        IRepository<SubscriptionPlan> repository,
        ILogger<CreateSubscriptionPlanRepository> logger) : ICreateSubscriptionPlanRepository
    {
        private readonly IRepository<SubscriptionPlan> _repository = repository;
        private readonly ILogger<CreateSubscriptionPlanRepository> _logger = logger;
        public async Task<SubscriptionPlanResult> CreateAsync(CreateSubscriptionPlanDto request, CancellationToken cancellationToken)
        {
            
            _logger.LogInformation("Creating new SubscriptionPlan");

            var entity = SubscriptionPlan.Create(
                request.Name,
                request.Description,
                request.Price,
                request.BillingCycle,
                request.MaxUsers,
                request.MaxStorageGB,
                request.TrialDays,
                request.Features
            );

            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();

            _logger.LogInformation("Created SubscriptionPlan with Id: {Id}", entity.Id);

            return new SubscriptionPlanResult
            {
                Id = entity.Id,
                Name = entity.Name,
                Description = entity.Description,
                Price = entity.Price,
                BillingCycle = entity.BillingCycle,
                MaxUsers = entity.MaxUsers,
                MaxStorageGB = entity.MaxStorageGB,
                IsActive = entity.IsActive,
                TrialDays = entity.TrialDays
            };
            }

    }
}
