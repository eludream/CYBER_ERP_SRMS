using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CyberErp.Srms.Inf.Models.EntityConfiguration.Core;

public class VoucherStatusConfiguration : IEntityTypeConfiguration<VoucherStatus>
{
    public void Configure(EntityTypeBuilder<VoucherStatus> builder)
    {
        builder.ToTable("VoucherStatus");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.Code)
            .IsRequired()
            .HasMaxLength(50);
    }
}
