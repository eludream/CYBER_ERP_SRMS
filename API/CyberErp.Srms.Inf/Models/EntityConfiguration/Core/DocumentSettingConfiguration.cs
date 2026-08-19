using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CyberErp.Srms.Inf.Models.EntityConfiguration
{
    public class DocumentSettingConfiguration : IEntityTypeConfiguration<DocumentSetting>
    {
        public void Configure(EntityTypeBuilder<DocumentSetting> builder)
        {
            builder.HasKey(ds => ds.Id);

            builder.Property(ds => ds.VoucherType)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(ds => ds.Prefix)
                .HasMaxLength(50);

            builder.Property(ds => ds.Sufix)
                .HasMaxLength(50);

            builder.Property(ds => ds.Year)
                .HasMaxLength(10);

            builder.Property(ds => ds.LastNumber)
                .IsRequired();

            // NodaTime Instant conversion for CreatedAt
            builder.Property(ds => ds.CreatedAt)
                .HasConversion(
                    v => v.ToDateTimeUtc(),
                    v => NodaTime.Instant.FromDateTimeUtc(v.ToUniversalTime())
                )
                .HasColumnType("datetime2(3)")
                .IsRequired();

            // NodaTime Instant conversion for UpdatedAt
            builder.Property(ds => ds.UpdatedAt)
                .HasConversion(
                    v => v.HasValue ? v.Value.ToDateTimeUtc() : (DateTime?)null,
                    v => v.HasValue ? NodaTime.Instant.FromDateTimeUtc(v.Value.ToUniversalTime()) : null
                )
                .HasColumnType("datetime2(3)");

            builder.Property(ds => ds.RowVersion)
                ;
        }
    }
}


