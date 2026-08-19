using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CyberErp.Srms.Inf.Models.EntityConfiguration.Core;

public class ModuleDataSetConfiguration : IEntityTypeConfiguration<ModuleDataSet>
{
    public void Configure(EntityTypeBuilder<ModuleDataSet> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(150);
        builder.Property(x => x.PayloadJson).IsRequired().HasColumnType("nvarchar(max)");
        builder.HasIndex(x => new { x.TenantId, x.Name }).IsUnique();
    }
}
