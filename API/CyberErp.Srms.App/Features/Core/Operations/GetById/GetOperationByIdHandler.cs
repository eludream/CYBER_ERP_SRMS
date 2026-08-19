using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Operations.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Operations.GetById;

public class GetOperationByIdHandler(
    IRepository<Operation> repository,
    ILogger<GetOperationByIdHandler> logger)
    : IFeatureHandler<GetOperationByIdRequest, OperationDto?>
{
    public async Task<OperationDto?> Handle(GetOperationByIdRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Getting Operation with ID: {Id}", request.Id);

        var operation = await repository.GetAll()
            .Include(x => x.Module)
            .Where(x => x.Id == request.Id)
            .Select(x => new OperationDto
            {
                Id = x.Id,
                ModuleId = x.Module.SubSystemId,
                ParentOperationId = x.ModuleId,
                Name = x.Name,
                Module = x.Module.SubSystem.Name,
                Link = x.Link,
                Filter = x.Filter,
                Icon = x.Icon,
                DisplayOrder = x.DisplayOrder,
                IsActive = x.IsActive
            })
            .FirstOrDefaultAsync(ct);

        return operation;
    }
}
