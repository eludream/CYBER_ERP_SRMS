using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CyberErp.Srms.Dom.Entities.Core;

namespace CyberErp.Srms.Inf.Models.EntityConfiguration.Core
{
    public class ApproverConfiguration : IEntityTypeConfiguration<Approver>
    {
        public void Configure(EntityTypeBuilder<Approver> builder)
        {
            builder.HasKey(m => m.Id);

            builder.Property(m => m.VoucherType)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(m => m.ApproverId)
                .IsRequired();
            builder.HasOne(c => c.ApproverUser)
            .WithMany()
            .HasForeignKey(srd => srd.ApproverId)
            .OnDelete(DeleteBehavior.Restrict);

            builder.Property(m => m.StatusId)
                .IsRequired();
            builder.HasOne(m => m.Status)
                .WithMany()
                .HasForeignKey(m => m.StatusId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Property(m => m.Criteria)
                .HasMaxLength(500);

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


