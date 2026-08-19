using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CyberErp.Srms.Inf.Models.EntityConfiguration.Core;

public class UserPreferenceConfiguration : IEntityTypeConfiguration<UserPreference>
{
    public void Configure(EntityTypeBuilder<UserPreference> builder)
    {
        builder.ToTable("UserPreference", "Core");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.TenantId, x.UserId }).IsUnique();
        builder.Property(x => x.Language).IsRequired().HasMaxLength(10).HasDefaultValue("en");
        builder.Property(x => x.TimeZone).IsRequired().HasMaxLength(100).HasDefaultValue("Africa/Nairobi");
        builder.Property(x => x.DateFormat).IsRequired().HasMaxLength(30).HasDefaultValue("dd/MM/yyyy");
        builder.Property(x => x.NumberFormat).IsRequired().HasMaxLength(30).HasDefaultValue("1,234.56");
        builder.Property(x => x.LandingPage).IsRequired().HasMaxLength(200).HasDefaultValue("/");
        builder.Property(x => x.Theme).IsRequired().HasMaxLength(20).HasDefaultValue("system");
        builder.Property(x => x.EmailNotifications).HasDefaultValue(true);
        builder.Property(x => x.InAppNotifications).HasDefaultValue(true);
        builder.Property(x => x.ApprovalNotifications).HasDefaultValue(true);
        builder.HasOne<User>().WithOne().HasForeignKey<UserPreference>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
