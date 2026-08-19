using CyberErp.Srms.Inf.Models;
using Finbuckle.MultiTenant.Abstractions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CyberErp.Srms.Api;

public class SrmsDbContextDesignTimeFactory : IDesignTimeDbContextFactory<SrmsDbContext>
{
    public SrmsDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<SrmsDbContext>();
        var connectionString =
            "Server=CLOUDX-SICS2\\SQLEXPRESS;Database=CERP_Latest;Trusted_Connection=True;TrustServerCertificate=True;";
        optionsBuilder.UseSqlServer(connectionString, b => b.MigrationsAssembly("CyberErp.Srms.Inf"));

        var tenantAccessor = new StaticMultiTenantContextAccessor<AppTenantInfo>(new AppTenantInfo
        {
            Id = Guid.Empty.ToString(),
            Identifier = "design",
            Name = "Design Tenant",
            IsActive = true
        });

        return new SrmsDbContext(optionsBuilder.Options, tenantAccessor);
    }
}
