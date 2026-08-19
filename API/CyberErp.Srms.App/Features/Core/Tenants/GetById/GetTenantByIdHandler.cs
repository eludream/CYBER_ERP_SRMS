using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.Tenants.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Tenants.GetById;

public class GetTenantByIdHandler(
    IRepository<Tenant> repository,
    ILogger<GetTenantByIdHandler> logger)
    : IFeatureHandler<GetTenantByIdRequest, TenantDto?>
{
    public async Task<TenantDto?> Handle(GetTenantByIdRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Getting Tenant by Id: {Id}", request.Id);

        var tenant = await repository.GetAllWithoutTenantFilter()
            .Where(t => t.Id == request.Id)
            .Select(t => new TenantDto
            {
                Id = t.Id,
                TenantTypeId = t.TenantTypeId,
                TenantTypeName = t.TenantType == null ? null : t.TenantType.Name,
                Name = t.Name,
                Identifier = t.Identifier,
                ConnectionString = t.ConnectionString,
                Theme = t.Theme,
                Address = t.Address,
                PhoneNumber = t.PhoneNumber,
                Email = t.Email,
                IsActive = t.IsActive,
                SubscriptionStartDate = t.SubscriptionStartDate,
                SubscriptionEndDate = t.SubscriptionEndDate,
                CreatedBy = t.CreatedBy,
                CreatedAt = t.CreatedAt.ToString(),
                UpdatedBy = t.UpdatedBy,
                UpdatedAt = t.UpdatedAt.HasValue ? t.UpdatedAt.Value.ToString() : null
            })
            .FirstOrDefaultAsync(ct);

        if (tenant == null)
        {
            logger.LogWarning("Tenant not found with Id: {Id}", request.Id);
            throw new NotFoundException(nameof(Tenant), request.Id.ToString());
        }

        return tenant;
    }
}
