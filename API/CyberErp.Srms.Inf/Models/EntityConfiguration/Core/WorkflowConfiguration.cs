using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CyberErp.Srms.Dom.Entities.Core;

namespace CyberErp.Srms.Inf.Models.EntityConfiguration
{
    public class WorkflowConfiguration : IEntityTypeConfiguration<Workflow>
    {
        public void Configure(EntityTypeBuilder<Workflow> builder)
        {
            builder.HasKey(w => w.Id);

            builder.Property(w => w.Step)
                .IsRequired();

            builder.Property(w => w.VoucherType)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(w => w.StatusId)
                .IsRequired();

            builder.HasOne(w => w.Status)
                .WithMany()
                .HasForeignKey(w => w.StatusId)
                .OnDelete(DeleteBehavior.Restrict);

            // NodaTime Instant conversion for CreatedAt
            builder.Property(w => w.CreatedAt)
                .HasConversion(
                    v => v.ToDateTimeUtc(),
                    v => NodaTime.Instant.FromDateTimeUtc(v.ToUniversalTime())
                )
                .HasColumnType("datetime2(3)")
                .IsRequired();

            // NodaTime Instant conversion for UpdatedAt
            builder.Property(w => w.UpdatedAt)
                .HasConversion(
                    v => v.HasValue ? v.Value.ToDateTimeUtc() : (DateTime?)null,
                    v => v.HasValue ? NodaTime.Instant.FromDateTimeUtc(v.Value.ToUniversalTime()) : null
                )
                .HasColumnType("datetime2(3)");

            builder.Property(w => w.RowVersion)
                ;
        }
    }
}


