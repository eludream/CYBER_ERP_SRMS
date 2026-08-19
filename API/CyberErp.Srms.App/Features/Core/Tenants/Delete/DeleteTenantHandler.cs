using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Tenants.Delete;

public record TenantResult(Guid Id, string Name, string Identifier, string? ConnectionString = null, string? Theme = null, string? Address = null, string? PhoneNumber = null, string? Email = null, bool IsActive = true, DateTime? SubscriptionStartDate = null, DateTime? SubscriptionEndDate = null);

public class DeleteTenantHandler(
    IRepository<Tenant> repository,
    IUnitOfWork unitOfWork,
    ILogger<DeleteTenantHandler> logger)
    : IFeatureHandler<DeleteTenantRequest, TenantResult>
{
    public async Task<TenantResult> Handle(DeleteTenantRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Deleting Tenant with Id: {Id}", request.Id);

        var tenant = await repository.GetAllWithoutTenantFilter()
            .FirstOrDefaultAsync(t => t.Id == request.Id, ct);

        if (tenant == null)
        {
            logger.LogWarning("Tenant not found with Id: {Id}", request.Id);
            throw new NotFoundException(nameof(Tenant), request.Id.ToString());
        }

        repository.Delete(tenant);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Deleted Tenant with Id: {Id}", tenant.Id);

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