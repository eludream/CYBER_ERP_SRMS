using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CyberErp.Srms.Dom.Entities.Core;

namespace CyberErp.Srms.Inf.Models.EntityConfiguration
{
    public class OperationConfiguration : IEntityTypeConfiguration<Operation>
    {
        public void Configure(EntityTypeBuilder<Operation> builder)
        {
            builder.ToTable("Operation", "Core");
            builder.HasKey(o => o.Id);

            builder.Property(o => o.ModuleId).IsRequired();
            builder.Ignore(o => o.TenantId);

            builder.Property(o => o.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(o => o.Link)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(o => o.Filter)
                .HasMaxLength(200);

            builder.Property(o => o.Icon)
                .HasMaxLength(100);

            builder.Property(o => o.DisplayOrder)
                .IsRequired();

            builder.Property(o => o.IsActive)
                .IsRequired();

            builder.HasOne(o => o.Module)
                .WithMany()
                .HasForeignKey(o => o.ModuleId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(o => new { o.ModuleId, o.DisplayOrder });

            // NodaTime Instant conversion for CreatedAt
            builder.Property(o => o.CreatedAt)
                .HasConversion(
                    v => v.ToDateTimeUtc(),
                    v => NodaTime.Instant.FromDateTimeUtc(v.ToUniversalTime())
                )
                .HasColumnType("datetime2(3)")
                .IsRequired();

            // NodaTime Instant conversion for UpdatedAt
            builder.Property(o => o.UpdatedAt)
                .HasConversion(
                    v => v.HasValue ? v.Value.ToDateTimeUtc() : (DateTime?)null,
                    v => v.HasValue ? NodaTime.Instant.FromDateTimeUtc(v.Value.ToUniversalTime()) : null
                )
                .HasColumnType("datetime2(3)");

            builder.Property(o => o.RowVersion)
                ;
        }
    }
}


