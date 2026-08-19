using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.Operations.Update;

public record UpdateOperationRequest(Guid Id, Guid ModuleId, Guid? ParentOperationId, string Name, string Link, string Filter,
    string Icon, int DisplayOrder, bool IsActive);

public class UpdateOperationRequestValidator : AbstractValidator<UpdateOperationRequest>
{
    public UpdateOperationRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.");

        RuleFor(x => x.ModuleId)
            .NotEmpty().WithMessage("ModuleId is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.Link)
            .MaximumLength(500).WithMessage("Link must not exceed 500 characters.");

        RuleFor(x => x.Filter)
            .MaximumLength(500).WithMessage("Filter must not exceed 500 characters.");

        RuleFor(x => x.Icon)
            .MaximumLength(100).WithMessage("Icon must not exceed 100 characters.");
    }
}
