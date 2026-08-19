using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.TenantSubscriptions.DTOs
{
    public class TenantSubscriptionDtoValidator : AbstractValidator<TenantSubscriptionDto>
    {
        public TenantSubscriptionDtoValidator()
        {
            RuleFor(x => x.TenantId)
                .NotEmpty().WithMessage("TenantId is required.");

            RuleFor(x => x.SubscriptionPlanId)
                .NotEmpty().WithMessage("SubscriptionPlanId is required.");

            RuleFor(x => x.StartDate)
                .NotEmpty().WithMessage("StartDate is required.");
        }
    }

    public class UpdateTenantSubscriptionDtoValidator : AbstractValidator<UpdateTenantSubscriptionDto>
    {
        public UpdateTenantSubscriptionDtoValidator()
        {
            RuleFor(x => x.Id)
                .NotEmpty().WithMessage("Id is required.");

            RuleFor(x => x.SubscriptionPlanId)
                .NotEmpty().WithMessage("SubscriptionPlanId is required.");

            RuleFor(x => x.Status)
                .NotEmpty().WithMessage("Status is required.")
                .MaximumLength(50).WithMessage("Status must not exceed 50 characters.");
        }
    }

    public class TenantSubscriptionDto
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public Guid SubscriptionPlanId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime? TrialEndDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal AmountPaid { get; set; }
        public string? PaymentMethod { get; set; }
        public string? TransactionId { get; set; }
        public DateTime? LastPaymentDate { get; set; }
        public DateTime? NextBillingDate { get; set; }
        public bool AutoRenew { get; set; }
        
        // Navigation properties
        public string? TenantName { get; set; }
        public string? PlanName { get; set; }
        public string? CreatedBy { get; set; }
        public string? CreatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public string? UpdatedAt { get; set; }
    }

    public class CreateTenantSubscriptionDto
    {
        public Guid TenantId { get; set; }
        public Guid SubscriptionPlanId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal AmountPaid { get; set; }
        public string? PaymentMethod { get; set; }
        public string? TransactionId { get; set; }
    }

    public class UpdateTenantSubscriptionDto
    {
        public Guid Id { get; set; }
        public Guid SubscriptionPlanId { get; set; }
        public DateTime? EndDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal AmountPaid { get; set; }
        public string? PaymentMethod { get; set; }
        public string? TransactionId { get; set; }
        public bool AutoRenew { get; set; }
        public string? UpdatedBy { get; set; }
    }

    public class TenantSubscriptionResult
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public Guid SubscriptionPlanId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal AmountPaid { get; set; }
        public bool AutoRenew { get; set; }
    }
}
