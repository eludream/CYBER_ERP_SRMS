using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;

namespace CyberErp.Srms.Inf.Models.EntityConfiguration;

internal static class ControlPlaneConfiguration
{
    public static void Configure(ModelBuilder b)
    {
        b.Entity<NavigationModule>(e =>
        {
            e.ToTable("Module", "Core");
            e.HasKey(x => x.Id);
            e.Ignore(x => x.TenantId);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Filter).HasMaxLength(200).IsRequired();
            e.Property(x => x.Icon).HasMaxLength(100).IsRequired();
            e.HasIndex(x => new { x.SubSystemId, x.DisplayOrder });
            e.HasOne(x => x.SubSystem).WithMany().HasForeignKey(x => x.SubSystemId).OnDelete(DeleteBehavior.Restrict);
        });
        b.Entity<TenantNavigationModule>(e =>
        {
            e.ToTable("TenantModule", "Core");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Filter).HasMaxLength(500).IsRequired();
            e.Property(x => x.Icon).HasMaxLength(100).IsRequired();
            e.HasIndex(x => new { x.TenantId, x.SubSystemId, x.Name }).IsUnique();
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.SubSystem).WithMany().HasForeignKey(x => x.SubSystemId).OnDelete(DeleteBehavior.Restrict);
        });
        b.Entity<Organization>(e =>
        {
            e.ToTable("Organization", "Core"); e.HasKey(x => x.Id); e.Property(x => x.Code).HasMaxLength(80).IsRequired(); e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.LegalName).HasMaxLength(200).IsRequired(); e.Property(x => x.DisplayName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Logo).HasColumnType("varbinary(max)"); e.Property(x => x.LogoContentType).HasMaxLength(100);
            e.Property(x => x.Address).HasMaxLength(500); e.Property(x => x.PhoneNumber).HasMaxLength(50); e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x=>x.RegistrationNumber).HasMaxLength(100);e.Property(x=>x.TaxNumber).HasMaxLength(100);e.Property(x=>x.TINNumber).HasMaxLength(50);e.Property(x=>x.OrganizationType).HasMaxLength(100);e.Property(x=>x.Industry).HasMaxLength(150);e.Property(x=>x.Website).HasMaxLength(300);
            e.Property(x=>x.PostalAddress).HasMaxLength(500);e.Property(x=>x.Country).HasMaxLength(100);e.Property(x=>x.Region).HasMaxLength(100);e.Property(x=>x.City).HasMaxLength(100);e.Property(x=>x.PostalCode).HasMaxLength(30);
            e.Property(x=>x.PrimaryContactName).HasMaxLength(150);e.Property(x=>x.PrimaryContactTitle).HasMaxLength(100);e.Property(x=>x.PrimaryContactEmail).HasMaxLength(200);e.Property(x=>x.PrimaryContactPhone).HasMaxLength(50);
            e.Property(x=>x.DefaultLanguage).HasMaxLength(20);e.Property(x=>x.DataRetentionPolicy).HasMaxLength(1000);e.Property(x=>x.RegulatoryIdentifiers).HasMaxLength(1000);
            e.Property(x => x.Currency).HasMaxLength(3).IsFixedLength(); e.Property(x => x.Timezone).HasMaxLength(100); e.Property(x => x.Locale).HasMaxLength(20); e.Property(x => x.DateFormat).HasMaxLength(30);
        });
        b.Entity<LookupCategory>(e =>
        {
            e.ToTable("LookUpCategory", "Core"); e.HasKey(x => x.Id);
            e.Property(x => x.Code).HasMaxLength(50).IsRequired(); e.Property(x => x.Name).HasMaxLength(50).IsRequired();
            e.HasIndex(x => x.Code).IsUnique();
        });
        b.Entity<LookupCategoryItem>(e =>
        {
            e.ToTable("LookUpCategoryList", "Core"); e.HasKey(x => x.Id);
            e.Property(x => x.Code).HasMaxLength(50).IsRequired(); e.Property(x => x.Name).HasMaxLength(50).IsRequired();
            e.HasIndex(x => new { x.CategoryId, x.Code }).IsUnique();
            e.HasOne(x => x.Category).WithMany(x => x.Items).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        });
        b.Entity<TenantUser>(e =>
        {
            e.ToTable("TenantUser", "Core"); e.HasKey(x => x.Id); e.HasIndex(x => new { x.TenantId, x.UserId }).IsUnique(); e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            e.HasAlternateKey(x => new { x.Id, x.TenantId });
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Restrict); e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });
        b.Entity<SubscriptionPlanModule>(e =>
        {
            e.ToTable("SubscriptionPlanModule", "Core"); e.HasKey(x => x.Id); e.HasIndex(x => new { x.SubscriptionPlanId, x.ModuleId }).IsUnique();
            e.HasOne(x => x.SubscriptionPlan).WithMany().HasForeignKey(x => x.SubscriptionPlanId).OnDelete(DeleteBehavior.Cascade); e.HasOne(x => x.Module).WithMany().HasForeignKey(x => x.ModuleId).OnDelete(DeleteBehavior.Restrict);
        });
        b.Entity<StandardRoleTemplate>(e =>
        {
            e.ToTable("Role", "Core"); e.HasKey(x => x.Id); e.Property(x => x.Code).HasMaxLength(80).IsRequired(); e.HasIndex(x => x.Code).IsUnique(); e.Property(x => x.Name).HasMaxLength(100).IsRequired(); e.Property(x => x.Description).HasMaxLength(500); e.Property(x => x.IsPlatformRole).IsRequired();
        });
        b.Entity<OrganizationSubscription>(e =>
        {
            e.ToTable("OrganizationSubscription", "Core"); e.HasKey(x => x.Id); e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30); e.Property(x => x.Currency).HasMaxLength(3).IsFixedLength();
            e.HasOne(x => x.Organization).WithMany().HasForeignKey(x => x.OrganizationId).OnDelete(DeleteBehavior.Restrict); e.HasOne(x => x.SubscriptionPlan).WithMany().HasForeignKey(x => x.SubscriptionPlanId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.OrganizationId, x.StartDate });
            e.HasAlternateKey(x => new { x.Id, x.OrganizationId });
        });
        b.Entity<TenantModule>(e =>
        {
            e.ToTable("TenantSubSystem", "Core"); e.HasKey(x => x.Id); e.Property(x => x.SourceType).HasConversion<string>().HasMaxLength(60); e.Property(x => x.Status).IsRequired();
            e.Ignore(x => x.OrganizationId); e.Ignore(x => x.OrganizationSubscriptionId);
            e.Property(x => x.ModuleId).HasColumnName("SubSystemId");
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Restrict); e.HasOne(x => x.Module).WithMany().HasForeignKey(x => x.ModuleId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.TenantId, x.ModuleId, x.StartDate }).IsUnique();
        });
        b.Entity<TenantOperation>(e =>
        {
            e.ToTable("TenantOperation", "Core");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Link).HasMaxLength(500);
            e.Property(x => x.Filter).HasMaxLength(500);
            e.Property(x => x.Icon).HasMaxLength(100);
            e.Property(x => x.TenantModuleId).HasColumnName("ModuleId");
            e.HasIndex(x => new { x.TenantModuleId, x.DisplayOrder });
            e.HasOne(x => x.TenantModule).WithMany().HasForeignKey(x => x.TenantModuleId).OnDelete(DeleteBehavior.Restrict);
        });
        b.Entity<TenantSubscriptionAddOn>(e => { e.ToTable("TenantSubscriptionAddOn", "Core"); e.HasKey(x => x.Id); e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30); e.Property(x => x.Currency).HasMaxLength(3); e.Property(x => x.Amount).HasPrecision(18, 2); });
        b.Entity<TenantRole>(e =>
        {
            e.ToTable("TenantRole", "Core"); e.HasKey(x => x.Id); e.Property(x => x.Code).HasMaxLength(80).IsRequired(); e.Property(x => x.Name).HasMaxLength(100).IsRequired(); e.HasIndex(x => new { x.TenantId, x.Code }).IsUnique();
            e.HasAlternateKey(x => new { x.Id, x.TenantId });
            e.HasOne<StandardRoleTemplate>().WithMany().HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.SetNull); e.HasOne<Tenant>().WithMany().HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Restrict);
        });
        b.Entity<TenantRolePermission>(e =>
        {
            e.ToTable("TenantRolePermission", "Core"); e.HasKey(x => x.Id); e.HasIndex(x => new { x.TenantRoleId, x.TenantOperationId }).IsUnique(); e.HasOne(x => x.TenantRole).WithMany(x => x.Permissions).HasForeignKey(x => x.TenantRoleId).OnDelete(DeleteBehavior.Cascade); e.HasOne(x => x.TenantOperation).WithMany().HasForeignKey(x => x.TenantOperationId).OnDelete(DeleteBehavior.Restrict);
        });
        b.Entity<TenantUserRole>(e =>
        {
            e.ToTable("TenantUserRole", "Core"); e.HasKey(x => x.Id); e.HasIndex(x => new { x.TenantUserId, x.TenantRoleId }).IsUnique(); e.HasOne(x => x.TenantUser).WithMany(x => x.RoleAssignments).HasForeignKey(x => x.TenantUserId).OnDelete(DeleteBehavior.Cascade); e.HasOne(x => x.TenantRole).WithMany().HasForeignKey(x => x.TenantRoleId).OnDelete(DeleteBehavior.Restrict);
        });

        foreach (var type in new[] { typeof(Organization), typeof(LookupCategory), typeof(LookupCategoryItem), typeof(TenantUser), typeof(SubscriptionPlanModule), typeof(StandardRoleTemplate), typeof(OrganizationSubscription), typeof(TenantModule), typeof(NavigationModule), typeof(TenantNavigationModule), typeof(TenantOperation), typeof(TenantSubscriptionAddOn), typeof(TenantRole), typeof(TenantRolePermission), typeof(TenantUserRole) })
        {
            b.Entity(type).Property(nameof(ControlPlaneEntity.CreatedAt)).HasColumnType("datetime2(3)");
            b.Entity(type).Property(nameof(ControlPlaneEntity.UpdatedAt)).HasColumnType("datetime2(3)");
            // These columns are binary(8), not SQL Server rowversion columns. Values are
            // generated by ControlPlaneEntity and must be included in INSERT/UPDATE.
            b.Entity(type).Property(nameof(ControlPlaneEntity.RowVersion)).IsConcurrencyToken().ValueGeneratedNever();
        }

        // The lookup tables were created with datetime2(7) for CreatedAt and
        // datetime2(3) for UpdatedAt; retain those exact database precisions.
        b.Entity<LookupCategory>().Property(x => x.CreatedAt).HasColumnType("datetime2(7)");
        b.Entity<LookupCategory>().Property(x => x.UpdatedAt).HasColumnType("datetime2(3)");
        b.Entity<LookupCategoryItem>().Property(x => x.CreatedAt).HasColumnType("datetime2(7)");
        b.Entity<LookupCategoryItem>().Property(x => x.UpdatedAt).HasColumnType("datetime2(3)");
    }
}
