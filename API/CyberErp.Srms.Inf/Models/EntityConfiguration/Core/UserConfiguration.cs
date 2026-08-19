using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CyberErp.Srms.Dom.Entities.Core;

namespace CyberErp.Srms.Inf.Models.EntityConfiguration
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.HasKey(u => u.Id);
            builder.Property(u => u.EmployeeId);

            builder.Property(u => u.FullName)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(u => u.PhoneNumber)
                .HasMaxLength(50);

            builder.Property(u => u.UserName)
                .IsRequired()
                .HasMaxLength(100);
            builder.Property(u => u.NormalizedUserName).IsRequired().HasMaxLength(100);
            builder.Property(u => u.NormalizedEmail).IsRequired().HasMaxLength(200);
            builder.HasIndex(u => u.NormalizedUserName).IsUnique();
            builder.HasIndex(u => u.NormalizedEmail).IsUnique();
            builder.Ignore(u => u.TenantId);

            builder.Property(u => u.Password)
                .IsRequired()
                .HasMaxLength(255)
                .HasColumnName("PasswordHash");

            builder.Property(u => u.AccountStatus).IsRequired().HasDefaultValue(true);
            builder.Property(u => u.ProfilePicture).HasColumnType("varbinary(max)");
            builder.Property(u => u.ProfilePictureContentType).HasMaxLength(100);
            builder.Property(u => u.TwoFactorEnabled).HasDefaultValue(false);
            builder.Property(u => u.FailedLoginAttempts).HasDefaultValue(0);
            builder.Property(u => u.LockoutEndUtc).HasColumnType("datetime2(7)");

            // NodaTime Instant conversion for CreatedAt
            builder.Property(u => u.CreatedAt)
                .HasConversion(
                    v => v.ToDateTimeUtc(),
                    v => NodaTime.Instant.FromDateTimeUtc(v.ToUniversalTime())
                )
                .HasColumnType("datetime2(3)")
                .IsRequired();

            // NodaTime Instant conversion for UpdatedAt
            builder.Property(u => u.UpdatedAt)
                .HasConversion(
                    v => v.HasValue ? v.Value.ToDateTimeUtc() : (DateTime?)null,
                    v => v.HasValue ? NodaTime.Instant.FromDateTimeUtc(v.Value.ToUniversalTime()) : null
                )
                .HasColumnType("datetime2(3)");

            builder.Property(u => u.RowVersion)
                ;
        }
    }
}


