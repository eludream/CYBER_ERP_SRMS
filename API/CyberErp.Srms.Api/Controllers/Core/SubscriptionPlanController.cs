using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CyberErp.Srms.Api.Controllers;
using CyberErp.Srms.App.Features.Core.SubscriptionPlans.Create;
using CyberErp.Srms.App.Features.Core.SubscriptionPlans.DTOs;

namespace CyberErp.Srms.Api.Controllers.Core
{
    public class SubscriptionPlanController : BaseController
    {
        private readonly ICreateSubscriptionPlan _createSubscriptionPlan;

        public SubscriptionPlanController(
            ICreateSubscriptionPlan createSubscriptionPlan)
        {
            _createSubscriptionPlan = createSubscriptionPlan;
        }

        [HttpPost]
        public async Task<SubscriptionPlanResult> Create([FromBody] CreateSubscriptionPlanDto dto)
        {
            return await _createSubscriptionPlan.CreateAsync(dto);
        }
    }
}

