using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CyberErp.Srms.Inf.Configurations
{
    public class SettingConfiguration : IEntityTypeConfiguration<Setting>
    {
        public void Configure(EntityTypeBuilder<Setting> builder)
        {
            builder.ToTable("Settings");

            builder.HasKey(ms => ms.Id);

            builder.Property(ms => ms.Type)
                .IsRequired(false)
                .HasMaxLength(200);

            builder.Property(ms => ms.SettingKey)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(ms => ms.SettingValue)
                .HasMaxLength(1000);

            builder.Property(ms => ms.Description)
                .HasMaxLength(500);

            builder.Property(ms => ms.CreatedAt)
                .IsRequired()
                .HasDefaultValueSql("GETDATE()");

            builder.Property(ms => ms.CreatedBy)
                .HasMaxLength(100);

            builder.Property(ms => ms.UpdatedAt)
                .IsRequired(false);

            builder.Property(ms => ms.UpdatedBy)
                .HasMaxLength(100);

            // Indexes
            builder.HasIndex(ms => ms.SettingKey)
                .IsUnique()
                .HasDatabaseName("IX_Settings_SettingKey");

            builder.HasIndex(ms => ms.Type)
                .HasDatabaseName("IX_Settings_Type");
        }
    }
}
