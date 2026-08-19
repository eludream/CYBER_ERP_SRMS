using CyberErp.Srms.App.Common.DTOs;
using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.Modules.GetAll;

public class GetAllModulesRequest : GetAllRequest;

public class GetAllModulesRequestValidator : AbstractValidator<GetAllModulesRequest>
{
    public GetAllModulesRequestValidator()
    {
        RuleFor(x => x.Skip)
            .NotEmpty().WithMessage("Skip is required.");

        RuleFor(x => x.Take)
            .NotEmpty().WithMessage("Take is required.");
    }
}
