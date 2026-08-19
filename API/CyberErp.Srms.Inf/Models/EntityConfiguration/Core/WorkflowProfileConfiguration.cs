using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CyberErp.Srms.Inf.Models.EntityConfiguration.Core;

public class WorkflowProfileConfiguration : IEntityTypeConfiguration<WorkflowProfile>
{
    public void Configure(EntityTypeBuilder<WorkflowProfile> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.Property(x => x.Module).IsRequired().HasMaxLength(100);
        builder.Property(x => x.DocumentType).IsRequired().HasMaxLength(150);
        builder.Property(x => x.IsActive).HasDefaultValue(true);
        builder.Property(x => x.Version).HasDefaultValue(1);
        builder.Property(x => x.DefinitionJson).IsRequired().HasColumnType("nvarchar(max)");
        builder.HasIndex(x => new { x.TenantId, x.Module, x.DocumentType }).IsUnique();
    }
}
