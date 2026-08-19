using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CyberErp.Srms.Dom.Entities.Core;

namespace CyberErp.Srms.Inf.Models.EntityConfiguration
{
    public class LoginTrailConfiguration : IEntityTypeConfiguration<LoginTrail>
    {
        public void Configure(EntityTypeBuilder<LoginTrail> builder)
        {
            builder.HasKey(lt => lt.Id);

            builder.Property(lt => lt.UserId);

            builder.Property(lt => lt.Date)
                .HasColumnType("datetime2(3)")
                .IsRequired();

            builder.Property(lt => lt.IpAddress)
                .IsRequired()
                .HasMaxLength(45); // IPv4 or IPv6

            builder.Property(lt => lt.Status)
                .HasMaxLength(50);

            builder.Property(lt => lt.UserNameAttempted).HasMaxLength(200);
            builder.Property(lt => lt.UserAgent).HasMaxLength(1000);
            builder.Property(lt => lt.FailureReason).HasMaxLength(500);
            builder.Property(lt => lt.EventType).IsRequired().HasMaxLength(30).HasDefaultValue("Login");

            builder.HasOne(lt => lt.User)
                .WithMany()
                .HasForeignKey(lt => lt.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            // NodaTime Instant conversion for CreatedAt
            builder.Property(lt => lt.CreatedAt)
                .HasConversion(
                    v => v.ToDateTimeUtc(),
                    v => NodaTime.Instant.FromDateTimeUtc(v.ToUniversalTime())
                )
                .HasColumnType("datetime2(3)")
                .IsRequired();

            // NodaTime Instant conversion for UpdatedAt
            builder.Property(lt => lt.UpdatedAt)
                .HasConversion(
                    v => v.HasValue ? v.Value.ToDateTimeUtc() : (DateTime?)null,
                    v => v.HasValue ? NodaTime.Instant.FromDateTimeUtc(v.Value.ToUniversalTime()) : null
                )
                .HasColumnType("datetime2(3)");

            builder.Property(lt => lt.RowVersion)
                ;
        }
    }
}


