using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.Inf.Common;
using CyberErp.Srms.Inf.Models;
using Finbuckle.MultiTenant.Abstractions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CyberErp.Srms.Api.Configuration;

public static class TenantSeedExtensions
{
    public static async Task SeedTenantsAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var tenantSeedService = scope.ServiceProvider.GetRequiredService<ITenantSeedService>();
        var tenantStore = scope.ServiceProvider.GetRequiredService<IMultiTenantStore<AppTenantInfo>>();
        
        var tenants = await tenantStore.GetAllAsync();
        var hasTenants = tenants.Any();
        
        // If no tenants exist, seed the default tenant from configuration
        if (!hasTenants)
        {
            var configuration = app.Services.GetRequiredService<IConfiguration>();
            var defaultTenants = configuration.GetSection("Finbuckle:MultiTenant:Stores:ConfigurationStore:Tenants").Get<List<AppTenantInfo>>();
            
            if (defaultTenants != null && defaultTenants.Any())
            {
                foreach (var defaultTenant in defaultTenants)
                {
                    if (defaultTenant.IsActive)
                    {
                        await tenantSeedService.SeedTenantDataAsync(defaultTenant.Id);
                    }
                }
            }
        }
        else
        {
            // Seed data for all existing tenants
            foreach (var tenant in tenants)
            {
                if (tenant.IsActive)
                {
                    await tenantSeedService.SeedTenantDataAsync(tenant.Id);
                }
            }
        }
    }
}