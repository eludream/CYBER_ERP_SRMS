using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;

namespace CyberErp.Srms.App.Features.Core.Tenants.Create;

public record TenantResult(Guid Id, string Name, string Identifier, string? ConnectionString = null, string? Theme = null, string? Address = null, string? PhoneNumber = null, string? Email = null, bool IsActive = true, DateTime? SubscriptionStartDate = null, DateTime? SubscriptionEndDate = null);

public class CreateTenantHandler(
    IRepository<Tenant> repository,
    IUnitOfWork unitOfWork,
    ITenantSeedService tenantSeedService,
    IHttpContextAccessor httpContextAccessor,
    IValidator<CreateTenantRequest> validator,
    ILogger<CreateTenantHandler> logger)
    : IFeatureHandler<CreateTenantRequest, TenantResult>
{
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    public async Task<TenantResult> Handle(CreateTenantRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var tenant = Tenant.Create(
            request.OrganizationId,
            request.Name,
            request.Identifier,
            request.ConnectionString,
            request.Theme,
            request.Address,
            request.PhoneNumber,
            request.Email,
            request.SubscriptionStartDate,
            request.SubscriptionEndDate,
            request.TenantTypeId);

        await repository.AddAsync(tenant);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Created Tenant with Id: {Id}", tenant.Id);

        // Set skip tenant validation and the target tenant ID for seeding operation
        if (_httpContextAccessor.HttpContext != null)
        {
            _httpContextAccessor.HttpContext.Items["SkipTenantValidation"] = true;
            _httpContextAccessor.HttpContext.Items["SeedTenantId"] = tenant.Id.ToString();
        }

        // Seed tenant data (modules, operations, roles, stores, etc.)
        await tenantSeedService.SeedTenantDataAsync(tenant.Id.ToString());

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
