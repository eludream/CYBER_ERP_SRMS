using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.Operations.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Operations.Update;

public class UpdateOperationHandler(
    IRepository<Operation> repository,
    IUnitOfWork unitOfWork,
    IValidator<UpdateOperationRequest> validator,
    ILogger<UpdateOperationHandler> logger)
    : IFeatureHandler<UpdateOperationRequest, OperationResult>
{
    public async Task<OperationResult> Handle(UpdateOperationRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var operation = await repository.GetAll()
            .Where(x => x.Id == request.Id)
            .FirstOrDefaultAsync();
        if (operation == null)
            throw new NotFoundException(nameof(Operation), request.Id.ToString());

        if (!request.ParentOperationId.HasValue)
            throw new AppValidationException([new FluentValidation.Results.ValidationFailure(nameof(request.ParentOperationId), "A module is required for an operation.")]);

        operation.Update(
            request.ParentOperationId.Value,
            request.Name,
            request.Link,
            request.Filter,
            request.Icon,
            request.DisplayOrder,
            operation.IsActive); // Platform catalog state is not tenant-editable.

        repository.UpdateAsync(operation);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Operation updated with Id: {Id}", operation.Id);

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
