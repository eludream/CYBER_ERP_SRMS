using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.SubscriptionPlans.DTOs
{
    public class CreateSubscriptionPlanDtoValidator : AbstractValidator<CreateSubscriptionPlanDto>
    {
        public CreateSubscriptionPlanDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required.")
                .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters.");

            RuleFor(x => x.Price)
                .GreaterThanOrEqualTo(0).WithMessage("Price must be greater than or equal to 0.");

            RuleFor(x => x.BillingCycle)
                .NotEmpty().WithMessage("BillingCycle is required.")
                .MaximumLength(50).WithMessage("BillingCycle must not exceed 50 characters.");

            RuleFor(x => x.MaxUsers)
                .GreaterThan(0).WithMessage("MaxUsers must be greater than 0.");

            RuleFor(x => x.MaxStorageGB)
                .GreaterThanOrEqualTo(0).WithMessage("MaxStorageGB must be greater than or equal to 0.");

            RuleFor(x => x.TrialDays)
                .GreaterThanOrEqualTo(0).WithMessage("TrialDays must be greater than or equal to 0.");
        }
    }

    public class SubscriptionPlanDtoValidator : AbstractValidator<SubscriptionPlanDto>
    {
        public SubscriptionPlanDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required.")
                .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters.");

            RuleFor(x => x.Price)
                .GreaterThanOrEqualTo(0).WithMessage("Price must be greater than or equal to 0.");

            RuleFor(x => x.BillingCycle)
                .NotEmpty().WithMessage("BillingCycle is required.")
                .MaximumLength(50).WithMessage("BillingCycle must not exceed 50 characters.");

            RuleFor(x => x.MaxUsers)
                .GreaterThan(0).WithMessage("MaxUsers must be greater than 0.");

            RuleFor(x => x.MaxStorageGB)
                .GreaterThanOrEqualTo(0).WithMessage("MaxStorageGB must be greater than or equal to 0.");

            RuleFor(x => x.TrialDays)
                .GreaterThanOrEqualTo(0).WithMessage("TrialDays must be greater than or equal to 0.");
        }
    }

    public class UpdateSubscriptionPlanDtoValidator : AbstractValidator<UpdateSubscriptionPlanDto>
    {
        public UpdateSubscriptionPlanDtoValidator()
        {
            RuleFor(x => x.Id)
                .NotEmpty().WithMessage("Id is required.");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required.")
                .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters.");

            RuleFor(x => x.Price)
                .GreaterThanOrEqualTo(0).WithMessage("Price must be greater than or equal to 0.");

            RuleFor(x => x.BillingCycle)
                .NotEmpty().WithMessage("BillingCycle is required.")
                .MaximumLength(50).WithMessage("BillingCycle must not exceed 50 characters.");
        }
    }

    public class SubscriptionPlanDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string BillingCycle { get; set; } = string.Empty;
        public int MaxUsers { get; set; }
        public int MaxStorageGB { get; set; }
        public bool IsActive { get; set; }
        public int TrialDays { get; set; }
        public string? Features { get; set; }
        public string? CreatedBy { get; set; }
        public string? CreatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public string? UpdatedAt { get; set; }
    }

    public class CreateSubscriptionPlanDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string BillingCycle { get; set; } = string.Empty;
        public int MaxUsers { get; set; }
        public int MaxStorageGB { get; set; }
        public int TrialDays { get; set; }
        public string? Features { get; set; }
    }

    public class UpdateSubscriptionPlanDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string BillingCycle { get; set; } = string.Empty;
        public int MaxUsers { get; set; }
        public int MaxStorageGB { get; set; }
        public bool IsActive { get; set; }
        public int TrialDays { get; set; }
        public string? Features { get; set; }
        public string? UpdatedBy { get; set; }
    }

    public class SubscriptionPlanResult
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string BillingCycle { get; set; } = string.Empty;
        public int MaxUsers { get; set; }
        public int MaxStorageGB { get; set; }
        public bool IsActive { get; set; }
        public int TrialDays { get; set; }
    }
}
