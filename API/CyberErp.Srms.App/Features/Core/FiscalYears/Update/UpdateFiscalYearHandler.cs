using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NodaTime;
using CyberErp.Srms.App.Features.Core.FiscalYears.DTOs;

namespace CyberErp.Srms.App.Features.Core.FiscalYears.Update;

public class UpdateFiscalYearHandler(
    IRepository<FiscalYear> repository,
    IUnitOfWork unitOfWork,
    IValidator<UpdateFiscalYearRequest> validator,
    ILogger<UpdateFiscalYearHandler> logger)
    : IFeatureHandler<UpdateFiscalYearRequest, FiscalYearDto>
{
    public async Task<FiscalYearDto> Handle(UpdateFiscalYearRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var fiscalYear = await repository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (fiscalYear == null)
        {
            logger.LogWarning("FiscalYear with Id: {Id} not found", request.Id);
            throw new NotFoundException(nameof(FiscalYear), request.Id.ToString());
        }

        var startDate = Instant.FromUtc(2024, 1, 1, 0, 0);
        var endDate = Instant.FromUtc(2024, 12, 31, 23, 59);

        if (DateTime.TryParse(request.StartDate, out var startDateTime))
        {
            startDate = Instant.FromDateTimeUtc(startDateTime.ToUniversalTime());
        }

        if (DateTime.TryParse(request.EndDate, out var endDateTime))
        {
            endDate = Instant.FromDateTimeUtc(endDateTime.ToUniversalTime());
        }

        fiscalYear.Update(request.Name, startDate, endDate, request.IsActive);
        repository.UpdateAsync(fiscalYear);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("FiscalYear updated with Id: {Id}", fiscalYear.Id);

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