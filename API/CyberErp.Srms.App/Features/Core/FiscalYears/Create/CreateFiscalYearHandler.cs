using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.FiscalYears.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.Extensions.Logging;
using NodaTime;

namespace CyberErp.Srms.App.Features.Core.FiscalYears.Create;

public class CreateFiscalYearHandler(
    IRepository<FiscalYear> repository,
    IUnitOfWork unitOfWork,
    IValidator<CreateFiscalYearRequest> validator,
    ILogger<CreateFiscalYearHandler> logger)
    : IFeatureHandler<CreateFiscalYearRequest, FiscalYearDto>
{
    public async Task<FiscalYearDto> Handle(CreateFiscalYearRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var startDate = Instant.FromDateTimeUtc(DateTime.SpecifyKind(DateTime.Parse(request.StartDate), DateTimeKind.Utc));
        var endDate = Instant.FromDateTimeUtc(DateTime.SpecifyKind(DateTime.Parse(request.EndDate), DateTimeKind.Utc));

        var fiscalYear = FiscalYear.Create(
            request.Name,
            startDate,
            endDate,
            request.IsActive);

        await repository.AddAsync(fiscalYear);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("FiscalYear created with Id: {Id}", fiscalYear.Id);

        return new FiscalYearDto
        {
            Id = fiscalYear.Id,
            Name = fiscalYear.Name,
            StartDate = fiscalYear.StartDate.InUtc().ToString(),
            EndDate = fiscalYear.EndDate.InUtc().ToString(),
            IsActive = fiscalYear.IsActive
        };
    }
}