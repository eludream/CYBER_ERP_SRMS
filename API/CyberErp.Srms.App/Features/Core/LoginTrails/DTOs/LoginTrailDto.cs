using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.LoginTrails.DTOs
{
    public class LoginTrailDtoValidator : AbstractValidator<LoginTrailDto>
    {
        public LoginTrailDtoValidator()
        {
            RuleFor(x => x.Date)
                .NotEmpty().WithMessage("Date is required.");

            RuleFor(x => x.IpAddress)
                .NotEmpty().WithMessage("IpAddress is required.")
                .MaximumLength(50).WithMessage("IpAddress must not exceed 50 characters.");

            RuleFor(x => x.Status)
                .MaximumLength(100).WithMessage("Status must not exceed 100 characters.");
        }
    }

    public class UpdateLoginTrailDtoValidator : AbstractValidator<UpdateLoginTrailDto>
    {
        public UpdateLoginTrailDtoValidator()
        {
            RuleFor(x => x.Id)
                .NotEmpty().WithMessage("Id is required.");

            RuleFor(x => x.Date)
                .NotEmpty().WithMessage("Date is required.");

            RuleFor(x => x.IpAddress)
                .NotEmpty().WithMessage("IpAddress is required.")
                .MaximumLength(50).WithMessage("IpAddress must not exceed 50 characters.");

            RuleFor(x => x.Status)
                .MaximumLength(100).WithMessage("Status must not exceed 100 characters.");
        }
    }

    public class LoginTrailDto
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public DateTime Date { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public string? Status { get; set; }
    }

    public class UpdateLoginTrailDto
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public DateTime Date { get; set; }
        public string IpAddress { get; set; } = string.Empty;
        public string? Status { get; set; }
    }

    public class LoginTrailResult
    {
        public Guid Id { get; set; }
    }
}

