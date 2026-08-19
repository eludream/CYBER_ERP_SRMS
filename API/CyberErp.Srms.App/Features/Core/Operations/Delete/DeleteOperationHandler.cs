using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.Operations.DTOs;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Operations.Delete;

public class DeleteOperationHandler(
    IDeleteOperationRepository repository,
    ILogger<DeleteOperationHandler> logger)
    : IFeatureHandler<DeleteOperationRequest, OperationResult?>
{
    public async Task<OperationResult?> Handle(DeleteOperationRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Deleting Operation with Id: {Id}", request.Id);

        var operation = await repository.DeleteAsync(request.Id, ct);
        if (operation == null)
        {
            logger.LogWarning("Operation with ID: {Id} not found", request.Id);
            return null;
        }

        logger.LogInformation("Operation deleted successfully with ID: {Id}", operation.Id);

        return new OperationResult
        {
            Id = operation.Id,
            Name = operation.Name,
            Link = operation.Link,
            Icon = operation.Icon
        };
    }
}
