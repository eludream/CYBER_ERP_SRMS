using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.FiscalYears.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.FiscalYears.GetById;

public class GetFiscalYearByIdHandler(
    IRepository<FiscalYear> repository,
    ILogger<GetFiscalYearByIdHandler> logger)
    : IFeatureHandler<GetFiscalYearByIdRequest, FiscalYearDto>
{
    public async Task<FiscalYearDto> Handle(GetFiscalYearByIdRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Getting FiscalYear with ID: {Id}", request.Id);

        var fiscalYear = await repository.GetAll()
            .FirstOrDefaultAsync(fy => fy.Id == request.Id, ct);

        if (fiscalYear == null)
        {
            logger.LogWarning("FiscalYear with ID {Id} not found", request.Id);
            throw new NotFoundException(nameof(FiscalYear), request.Id.ToString());
        }

        return new FiscalYearDto
        {
            Id = fiscalYear.Id,
            Name = fiscalYear.Name,
            StartDate = fiscalYear.StartDate.ToString(),
            EndDate = fiscalYear.EndDate.ToString(),
            IsActive = fiscalYear.IsActive
        };
    }
}