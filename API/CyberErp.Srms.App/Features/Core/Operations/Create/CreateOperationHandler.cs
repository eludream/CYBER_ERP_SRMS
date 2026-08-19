using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.Operations.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Operations.Create;

public class CreateOperationHandler(
    IRepository<Operation> repository,
    IUnitOfWork unitOfWork,
    IValidator<CreateOperationRequest> validator,
    ILogger<CreateOperationHandler> logger)
    : IFeatureHandler<CreateOperationRequest, OperationResult>
{
    public async Task<OperationResult> Handle(CreateOperationRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        if (!request.ParentOperationId.HasValue)
            throw new AppValidationException([new FluentValidation.Results.ValidationFailure(nameof(request.ParentOperationId), "A module is required for an operation.")]);

        var siblingOrders = await repository.GetAll()
            .Where(x => x.ModuleId == request.ParentOperationId.Value)
            .Select(x => x.DisplayOrder)
            .ToListAsync(ct);
        var displayOrder = siblingOrders.DefaultIfEmpty(0).Max() + 1;

        var operation = Operation.Create(
            request.ParentOperationId.Value,
            request.Name,
            request.Link,
            request.Filter,
            request.Icon,
            displayOrder,
            request.IsActive);

        await repository.AddAsync(operation);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Operation created with Id: {Id}", operation.Id);

        return new OperationResult
        {
            Id = operation.Id,
            ModuleId = request.ModuleId,
            ParentOperationId = operation.ModuleId,
            Name = operation.Name,
            Link = operation.Link,
            Filter = operation.Filter,
            Icon = operation.Icon,
            DisplayOrder = operation.DisplayOrder,
            IsActive = operation.IsActive
        };
    }
}
