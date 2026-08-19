using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Tenants.Update;

public record TenantResult(Guid Id, string Name, string Identifier, string? ConnectionString = null, string? Theme = null, string? Address = null, string? PhoneNumber = null, string? Email = null, bool IsActive = true, DateTime? SubscriptionStartDate = null, DateTime? SubscriptionEndDate = null);

public class UpdateTenantHandler(
    IRepository<Tenant> repository,
    IUnitOfWork unitOfWork,
    IValidator<UpdateTenantRequest> validator,
    ILogger<UpdateTenantHandler> logger)
    : IFeatureHandler<UpdateTenantRequest, TenantResult>
{
    public async Task<TenantResult> Handle(UpdateTenantRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var tenant = await repository.GetAll()
            .FirstOrDefaultAsync(t => t.Id == request.Id, ct);

        if (tenant == null)
        {
            logger.LogWarning("Tenant not found with Id: {Id}", request.Id);
            throw new NotFoundException(nameof(Tenant), request.Id.ToString());
        }

        tenant.Update(
            request.Name,
            request.Identifier,
            request.ConnectionString,
            request.Theme,
            request.Address,
            request.PhoneNumber,
            request.Email,
            request.IsActive,
            request.SubscriptionStartDate,
            request.SubscriptionEndDate,
            request.TenantTypeId);

        repository.UpdateAsync(tenant);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Updated Tenant with Id: {Id}", tenant.Id);

        return new TenantResult(
            tenant.Id,
            tenant.Name,
            tenant.Identifier,
            tenant.ConnectionString,
            tenant.Theme,
            tenant.Address,
            tenant.PhoneNumber,
            tenant.Email,
            tenant.IsActive,
            tenant.SubscriptionStartDate,
            tenant.SubscriptionEndDate);
    }
}
