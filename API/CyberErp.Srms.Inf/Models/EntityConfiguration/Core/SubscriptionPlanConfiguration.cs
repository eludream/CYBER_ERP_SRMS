using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CyberErp.Srms.Dom.Entities.Core;

namespace CyberErp.Srms.Inf.Models.EntityConfiguration
{
    public class SubscriptionPlanConfiguration : IEntityTypeConfiguration<SubscriptionPlan>
    {
        public void Configure(EntityTypeBuilder<SubscriptionPlan> builder)
        {
            builder.ToTable("SubscriptionPlan", "Core");
            builder.HasKey(p => p.Id);
            builder.Ignore(p => p.TenantId);
            builder.Property(p => p.Code).HasMaxLength(80).IsRequired();
            builder.HasIndex(p => p.Code).IsUnique();

            builder.Property(p => p.Name)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(p => p.Description)
                .HasMaxLength(1000);

            builder.Property(p => p.Price)
                .HasPrecision(18, 2);

            builder.Property(p => p.BillingCycle)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(p => p.Features)
                .HasColumnType("text");

            builder.Property(p => p.IsActive)
                .IsRequired();

            // DateTime for CreatedAt
            builder.Property(p => p.CreatedAt)
                .HasColumnType("datetime2(7)")
                .IsRequired();

            // DateTime for UpdatedAt
            builder.Property(p => p.UpdatedAt)
                .HasColumnType("datetime2(7)");

            builder.Property(p => p.RowVersion)
                ;
        }
    }
}
