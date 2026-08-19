using CyberErp.Srms.App.Features.Core.SubscriptionPlans.DTOs;

namespace CyberErp.Srms.App.Features.Core.SubscriptionPlans.Create
{
    public interface ICreateSubscriptionPlan
    {
        Task<SubscriptionPlanResult> CreateAsync(CreateSubscriptionPlanDto dto);
    }
}
