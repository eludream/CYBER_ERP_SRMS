using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CyberErp.Srms.Dom.Entities.Core;

namespace CyberErp.Srms.Inf.Models.EntityConfiguration
{
    public class VoucherTransactionConfiguration : IEntityTypeConfiguration<VoucherTransaction>
    {
        public void Configure(EntityTypeBuilder<VoucherTransaction> builder)
        {
            builder.HasKey(m => m.Id);

            builder.Property(m => m.VoucherType)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(m => m.ApproverId)
                .IsRequired();

            builder.Property(m => m.VoucherId)
                .IsRequired();

            builder.Property(m => m.StatusId)
                .IsRequired();

            builder.Property(m => m.VoucherNumber)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(m => m.Date)
                .HasColumnType("datetime2(3)")
                .IsRequired();

            builder.HasOne(m => m.Approver)
                .WithMany()
                .HasForeignKey(m => m.ApproverId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(m => m.Status)
                .WithMany()
                .HasForeignKey(m => m.StatusId)
                .OnDelete(DeleteBehavior.Cascade);

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


