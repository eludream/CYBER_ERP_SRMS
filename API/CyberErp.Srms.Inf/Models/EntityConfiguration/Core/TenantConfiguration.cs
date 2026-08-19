using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CyberErp.Srms.Dom.Entities.Core;

namespace CyberErp.Srms.Inf.Models.EntityConfiguration
{
    public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
    {
        public void Configure(EntityTypeBuilder<Tenant> builder)
        {
            builder.HasKey(t => t.Id);
            // Tenant is the control-plane tenant record itself, so the inherited
            // tenant discriminator is not a database column on Core.Tenant.
            builder.Ignore(t => t.TenantId);
            builder.HasAlternateKey(t => new { t.Id, t.OrganizationId });
            builder.HasOne(t => t.Organization).WithMany(o => o.Tenants).HasForeignKey(t => t.OrganizationId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(t => t.TenantType).WithMany().HasForeignKey(t => t.TenantTypeId).OnDelete(DeleteBehavior.Restrict);

            builder.Property(t => t.Name)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(t => t.Identifier)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(t => t.ConnectionString)
                .HasMaxLength(500);

            builder.Property(t => t.Theme)
                .HasMaxLength(100);

            builder.Property(t => t.Address)
                .HasMaxLength(500);

            builder.Property(t => t.PhoneNumber)
                .HasMaxLength(50);

            builder.Property(t => t.Email)
                .HasMaxLength(200);

            builder.Property(t => t.IsActive)
                .IsRequired();

            builder.Property(t => t.SubscriptionStartDate)
                .HasColumnType("datetime2(7)");

            builder.Property(t => t.SubscriptionEndDate)
                .HasColumnType("datetime2(7)");

            // Configure unique index on Identifier
            builder.HasIndex(t => new { t.OrganizationId, t.Identifier })
                .IsUnique();

            // DateTime conversion for CreatedAt
            builder.Property(t => t.CreatedAt)
                .HasColumnType("datetime2(7)")
                .IsRequired();

            // DateTime conversion for UpdatedAt
            builder.Property(t => t.UpdatedAt)
                .HasColumnType("datetime2(7)");

            builder.Property(t => t.RowVersion)
                ;
        }
    }
}
