using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CyberErp.Srms.Dom.Entities.Core;

namespace CyberErp.Srms.Inf.Models.EntityConfiguration
{
    public class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
    {
        public void Configure(EntityTypeBuilder<RolePermission> builder)
        {
            builder.HasKey(rp => rp.Id);

            builder.Property(rp => rp.RoleId)
                .IsRequired();

            builder.Property(rp => rp.OperationId)
                .IsRequired();

            builder.Property(rp => rp.CanAdd)
                .IsRequired();

            builder.Property(rp => rp.CanEdit)
                .IsRequired();

            builder.Property(rp => rp.CanDelete)
                .IsRequired();

            builder.Property(rp => rp.CanApprove)
                .IsRequired();

            builder.Property(rp => rp.CanView)
                .IsRequired();

            builder.Property(rp => rp.CanExport)
                .IsRequired()
                .HasDefaultValue(false);

            builder.HasOne(rp => rp.Role)
                .WithMany(r => r.RolePermissions)
                .HasForeignKey(rp => rp.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(rp => rp.Operation)
                .WithMany()
                .HasForeignKey(rp => rp.OperationId)
                .OnDelete(DeleteBehavior.Restrict);

            // NodaTime Instant conversion for CreatedAt
            builder.Property(rp => rp.CreatedAt)
                .HasConversion(
                    v => v.ToDateTimeUtc(),
                    v => NodaTime.Instant.FromDateTimeUtc(v.ToUniversalTime())
                )
                .HasColumnType("datetime2(3)")
                .IsRequired();

            // NodaTime Instant conversion for UpdatedAt
            builder.Property(rp => rp.UpdatedAt)
                .HasConversion(
                    v => v.HasValue ? v.Value.ToDateTimeUtc() : (DateTime?)null,
                    v => v.HasValue ? NodaTime.Instant.FromDateTimeUtc(v.Value.ToUniversalTime()) : null
                )
                .HasColumnType("datetime2(3)");

            builder.Property(rp => rp.RowVersion)
                ;

            builder.HasIndex(rp => new { rp.TenantId, rp.RoleId, rp.OperationId }).IsUnique();
        }
    }
}


