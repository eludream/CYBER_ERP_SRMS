using FluentValidation;
using CyberErp.Srms.App.Common.DTOs;
using NodaTime;

namespace CyberErp.Srms.App.Features.Core.Approvers.DTOs
{
    public class ApproverDtoValidator : AbstractValidator<ApproverDto>
    {
        public ApproverDtoValidator()
        {
            RuleFor(x => x.VoucherType)
                .NotEmpty().WithMessage("VoucherType is required.")
                .MaximumLength(100).WithMessage("VoucherType must not exceed 100 characters.");

            RuleFor(x => x.ApproverId)
                .NotEmpty().WithMessage("ApproverId is required.");

            RuleFor(x => x.StatusId)
                .NotEmpty().WithMessage("StatusId is required.");

            RuleFor(x => x.Criteria)
                .MaximumLength(500).WithMessage("Criteria must not exceed 500 characters.");
        }
    }

    public class UpdateApproverDtoValidator : AbstractValidator<UpdateApproverDto>
    {
        public UpdateApproverDtoValidator()
        {
            RuleFor(x => x.Id)
                .NotEmpty().WithMessage("Id is required.");

            RuleFor(x => x.VoucherType)
                .NotEmpty().WithMessage("VoucherType is required.")
                .MaximumLength(100).WithMessage("VoucherType must not exceed 100 characters.");

            RuleFor(x => x.ApproverId)
                .NotEmpty().WithMessage("ApproverId is required.");

            RuleFor(x => x.StatusId)
                .NotEmpty().WithMessage("StatusId is required.");

            RuleFor(x => x.Criteria)
                .MaximumLength(500).WithMessage("Criteria must not exceed 500 characters.");
        }
    }


    public class ApproverDto
    {
        public string VoucherType { get; set; } = string.Empty;
        public Guid ApproverId { get; set; }
        public Guid StatusId { get; set; }
        public string Criteria { get; set; } = string.Empty;
    }

    public class GetApproverDto
    {
        public Guid Id { get; set; }
        public string VoucherType { get; set; } = string.Empty;
        public Guid ApproverId { get; set; }
        public Guid StatusId { get; set; }
        public string Approver { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Criteria { get; set; } = string.Empty;
    }

    public class UpdateApproverDto
    {
        public Guid Id { get; set; }
        public string VoucherType { get; set; } = string.Empty;
        public Guid ApproverId { get; set; }
        public Guid StatusId { get; set; }
        public string Criteria { get; set; } = string.Empty;
    }
    public class ApproverResult
    {
        public Guid Id { get; set; }
    }

    public class ApproveDtoValidator : AbstractValidator<ApproveDto>
    {
        public ApproveDtoValidator()
        {
            RuleFor(x => x.VoucherType)
                .NotEmpty().WithMessage("VoucherType is required.")
                .MaximumLength(100).WithMessage("VoucherType must not exceed 100 characters.");

            RuleFor(x => x.ApproverId)
                .NotEmpty().WithMessage("ApproverId is required.");

            RuleFor(x => x.VoucherId)
                .NotEmpty().WithMessage("VoucherId is required.");

            RuleFor(x => x.VoucherNumber)
                .NotEmpty().WithMessage("VoucherNumber is required.")
                .MaximumLength(100).WithMessage("VoucherNumber must not exceed 100 characters.");

            RuleFor(x => x.Date)
                .NotEmpty().WithMessage("Date is required.");

            RuleFor(x => x.Criteria)
                .MaximumLength(500).WithMessage("Criteria must not exceed 500 characters.");
        }
    }

    public class RejectDtoValidator : AbstractValidator<RejectDto>
    {
        public RejectDtoValidator()
        {
            RuleFor(x => x.VoucherType)
                .NotEmpty().WithMessage("VoucherType is required.")
                .MaximumLength(100).WithMessage("VoucherType must not exceed 100 characters.");        
            RuleFor(x => x.VoucherId)
                .NotEmpty().WithMessage("VoucherId is required.");
            RuleFor(x => x.ApproverId)
              .NotEmpty().WithMessage("ApproverId is required.");

        }
    }

    public class ApproveDto
    {
        public Guid Id { get; set; }

        public string VoucherType { get; set; } = string.Empty;
        public Guid ApproverId { get; set; }
        public Guid VoucherId { get; set; }
        public string VoucherNumber { get; set; } = string.Empty;
        public Instant Date { get; set; }
        public string Criteria { get; set; } = string.Empty;
        public bool IsResponded { get; set; } = false;
        public bool IsEmailed { get; set; } = false;
        public bool IsViewed { get; set; } = false;
        public bool IsSms { get; set; } = false;
        public Guid StatusId { get; set; }
    }
    public class RejectDto
    {
        public Guid Id { get; set; }
        public string VoucherType { get; set; } = string.Empty;
        public Guid VoucherId { get; set; }
        public string Remark { get; set; } = string.Empty;
        public Guid ApproverId { get; set; }
        public Guid StatusId { get; set; }
        public string VoucherNumber { get; set; } = string.Empty;



    }
}

