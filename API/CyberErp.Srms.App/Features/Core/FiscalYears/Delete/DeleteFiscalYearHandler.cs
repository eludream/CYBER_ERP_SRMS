using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using CyberErp.Srms.App.Features.Core.FiscalYears.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NodaTime;

namespace CyberErp.Srms.App.Features.Core.FiscalYears.Delete;

public class DeleteFiscalYearHandler(
    IRepository<FiscalYear> repository,
    IUnitOfWork unitOfWork,
    ILogger<DeleteFiscalYearHandler> logger)
    : IFeatureHandler<DeleteFiscalYearRequest, FiscalYearDto>
{
    public async Task<FiscalYearDto> Handle(DeleteFiscalYearRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Deleting FiscalYear with Id: {Id}", request.Id);

        var fiscalYear = await repository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (fiscalYear == null)
        {
            logger.LogWarning("FiscalYear with Id: {Id} not found", request.Id);
            throw new NotFoundException(nameof(FiscalYear), request.Id.ToString());
        }

        repository.Delete(fiscalYear);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("FiscalYear deleted successfully with Id: {Id}", fiscalYear.Id);

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