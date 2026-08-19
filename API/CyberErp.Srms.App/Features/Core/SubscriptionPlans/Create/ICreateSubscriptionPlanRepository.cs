using CyberErp.Srms.App.Features.Core.SubscriptionPlans.DTOs;

namespace CyberErp.Srms.App.Features.Core.SubscriptionPlans.Create
{
    public interface ICreateSubscriptionPlanRepository
    {
        Task<SubscriptionPlanResult> CreateAsync(CreateSubscriptionPlanDto dto, CancellationToken cancellationToken = default);
    }
}
