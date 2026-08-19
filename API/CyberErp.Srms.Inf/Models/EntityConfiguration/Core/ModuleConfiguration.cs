using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CyberErp.Srms.Dom.Entities.Core;

namespace CyberErp.Srms.Inf.Models.EntityConfiguration
{
    public class ModuleConfiguration : IEntityTypeConfiguration<Module>
    {
        public void Configure(EntityTypeBuilder<Module> builder)
        {
            builder.ToTable("SubSystem", "Core");
            builder.HasKey(m => m.Id);
            builder.Ignore(m => m.TenantId);

            builder.Property(m => m.Code).IsRequired().HasMaxLength(80);
            builder.HasIndex(m => m.Code).IsUnique();

            // Core.Module was renamed to Core.SubSystem and the former
            // free-text SubSystem column was removed.
            builder.Ignore(m => m.SubSystem);

            builder.Property(m => m.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(m => m.Abbreviation)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(m => m.Description).IsRequired().HasMaxLength(500);
            builder.Property(m => m.LandingPath).IsRequired().HasMaxLength(250);
            builder.Property(m => m.DisplayOrder).IsRequired();
            builder.Property(m => m.IsActive).IsRequired();

            builder.Property(m => m.Icon)
                .HasMaxLength(100);

            // NodaTime Instant conversion for CreatedAt
            builder.Property(m => m.CreatedAt)
                .HasConversion(
                    v => v.ToDateTimeUtc(),
                    v => NodaTime.Instant.FromDateTimeUtc(v.ToUniversalTime())
                )
                .HasColumnType("datetime2(3)")
                .IsRequired();

            // NodaTime Instant conversion for UpdatedAt
            builder.Property(m => m.UpdatedAt)
                .HasConversion(
                    v => v.HasValue ? v.Value.ToDateTimeUtc() : (DateTime?)null,
                    v => v.HasValue ? NodaTime.Instant.FromDateTimeUtc(v.Value.ToUniversalTime()) : null
                )
                .HasColumnType("datetime2(3)");


            ;
        }
    }
}


