using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using CyberErp.Srms.Dom.Entities.Core;
using Finbuckle.MultiTenant.Abstractions;
using Finbuckle.MultiTenant.EntityFrameworkCore;
using CyberErp.Srms.Inf.Models.EntityConfiguration;
using CyberErp.Srms.Inf.Models.EntityConfiguration.Core;
using CyberErp.Srms.Inf.Configurations;
using NodaTime;

namespace CyberErp.Srms.Inf.Models;

public class SrmsDbContext : MultiTenantDbContext
{
    public SrmsDbContext(DbContextOptions<SrmsDbContext> options, IMultiTenantContextAccessor<AppTenantInfo>? tenantContextAccessor = null)
        : base(tenantContextAccessor, options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            var basePath = AppContext.BaseDirectory;
            var appsettingsPath = Path.Combine(basePath, "CyberErp.Srms.Api", "appsettings.json");
            if (!File.Exists(appsettingsPath))
                appsettingsPath = Path.Combine(basePath, "appsettings.json");

            if (File.Exists(appsettingsPath))
            {
                var json = File.ReadAllText(appsettingsPath);
                using var doc = System.Text.Json.JsonDocument.Parse(json);
                var root = doc.RootElement;
                if (root.TryGetProperty("ConnectionStrings", out var connStrings) &&
                    connStrings.TryGetProperty("DefaultConnection", out var defaultConn))
                {
                    var conn = defaultConn.GetString();
                    if (!string.IsNullOrEmpty(conn))
                    {
                        optionsBuilder.UseSqlServer(conn, b => b.MigrationsAssembly("CyberErp.Srms.Inf"));
                    }
                }
            }
        }
    }

    public DbSet<User> User { get; set; }
    public DbSet<UserPreference> UserPreference { get; set; }
    public DbSet<Module> Module { get; set; }
    public DbSet<NavigationModule> NavigationModules => Set<NavigationModule>();
    public DbSet<TenantNavigationModule> TenantNavigationModules => Set<TenantNavigationModule>();
    public DbSet<Operation> Operation { get; set; }
    public DbSet<UserRole> UserRole { get; set; }
    public DbSet<LoginTrail> LoginTrail { get; set; }
    public DbSet<DocumentSetting> DocumentSetting { get; set; }
    public DbSet<Approver> Approver { get; set; }
    public DbSet<Notification> Notification { get; set; }
    public DbSet<VoucherTransaction> VoucherTransaction { get; set; }
    public DbSet<Workflow> Workflow { get; set; }
    public DbSet<WorkflowProfile> WorkflowProfile { get; set; }
    public DbSet<FiscalYear> FiscalYear { get; set; }
    public DbSet<Tenant> Tenant { get; set; }
    public DbSet<SubscriptionPlan> SubscriptionPlan { get; set; }
    public DbSet<TenantSubscription> TenantSubscription { get; set; }
    public DbSet<ModuleDataSet> ModuleDataSet { get; set; }
    public DbSet<VoucherStatus> VoucherStatus { get; set; }
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<LookupCategory> LookupCategories => Set<LookupCategory>();
    public DbSet<LookupCategoryItem> LookupCategoryItems => Set<LookupCategoryItem>();
    public DbSet<TenantUser> TenantUsers => Set<TenantUser>();
    public DbSet<SubscriptionPlanModule> SubscriptionPlanModules => Set<SubscriptionPlanModule>();
    public DbSet<StandardRoleTemplate> StandardRoleTemplates => Set<StandardRoleTemplate>();
    public DbSet<OrganizationSubscription> OrganizationSubscriptions => Set<OrganizationSubscription>();
    public DbSet<TenantModule> TenantModules => Set<TenantModule>();
    public DbSet<TenantOperation> TenantOperations => Set<TenantOperation>();
    public DbSet<TenantSubscriptionAddOn> TenantSubscriptionAddOns => Set<TenantSubscriptionAddOn>();
    public DbSet<TenantRole> TenantRoles => Set<TenantRole>();
    public DbSet<TenantRolePermission> TenantRolePermissions => Set<TenantRolePermission>();
    public DbSet<TenantUserRole> TenantUserRoles => Set<TenantUserRole>();
    public DbSet<PlatformSystemSettings> PlatformSystemSettings => Set<PlatformSystemSettings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasDefaultSchema("Core");

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.ClrType.GetProperties())
            {
                if (property.PropertyType == typeof(Guid))
                {
                    modelBuilder.Entity(entityType.ClrType)
                        .Property(property.Name)
                        .HasColumnType("uniqueidentifier");
                }
                else if (property.PropertyType == typeof(DateTime) || property.PropertyType == typeof(Instant))
                {
                    modelBuilder.Entity(entityType.ClrType)
                        .Property(property.Name)
                        .HasColumnType("datetime2(3)");
                }
                else if (property.PropertyType == typeof(DateTime?) || property.PropertyType == typeof(Instant?))
                {
                    modelBuilder.Entity(entityType.ClrType)
                        .Property(property.Name)
                        .HasColumnType("datetime2(7)");
                }
                else if (property.PropertyType == typeof(byte[]) && property.Name == "RowVersion")
                {
                    modelBuilder.Entity(entityType.ClrType)
                        .Property(property.Name)
                        .HasColumnType("varbinary(8)")
                        .IsConcurrencyToken()
                        .IsRequired();
                }
            }
        }

        var instantConverter = new ValueConverter<Instant, DateTime>(
            v => v.ToDateTimeUtc(),
            v => Instant.FromDateTimeUtc(DateTime.SpecifyKind(v, DateTimeKind.Utc)));

        var nullableInstantConverter = new ValueConverter<Instant?, DateTime?>(
            v => v.HasValue ? v.Value.ToDateTimeUtc() : null,
            v => v.HasValue ? Instant.FromDateTimeUtc(DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)) : null);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.ClrType.GetProperties().Where(p => p.PropertyType == typeof(Instant)))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .Property(property.Name)
                    .HasConversion(instantConverter);
            }

            foreach (var property in entityType.ClrType.GetProperties().Where(p => p.PropertyType == typeof(Instant?)))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .Property(property.Name)
                    .HasConversion(nullableInstantConverter);
            }
        }

        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new UserPreferenceConfiguration());
        modelBuilder.ApplyConfiguration(new ModuleDataSetConfiguration());
        modelBuilder.ApplyConfiguration(new ModuleConfiguration());
        modelBuilder.ApplyConfiguration(new OperationConfiguration());
        modelBuilder.ApplyConfiguration(new UserRoleConfiguration());
        modelBuilder.ApplyConfiguration(new LoginTrailConfiguration());
        modelBuilder.ApplyConfiguration(new DocumentSettingConfiguration());
        modelBuilder.ApplyConfiguration(new ApproverConfiguration());
        modelBuilder.ApplyConfiguration(new NotificationConfiguration());
        modelBuilder.ApplyConfiguration(new VoucherTransactionConfiguration());
        modelBuilder.ApplyConfiguration(new WorkflowConfiguration());
        modelBuilder.ApplyConfiguration(new WorkflowProfileConfiguration());
        modelBuilder.ApplyConfiguration(new FiscalYearConfiguration());
        modelBuilder.ApplyConfiguration(new TenantConfiguration());
        modelBuilder.ApplyConfiguration(new SubscriptionPlanConfiguration());
        modelBuilder.ApplyConfiguration(new TenantSubscriptionConfiguration());
        modelBuilder.ApplyConfiguration(new VoucherStatusConfiguration());
        modelBuilder.Entity<PlatformSystemSettings>(entity =>
        {
            entity.ToTable("Setting", "Core");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.SmtpHost).HasMaxLength(255);
            entity.Property(x => x.SmtpUser).HasMaxLength(255);
            entity.Property(x => x.BackupFrequency).HasMaxLength(20);
        });
        ControlPlaneConfiguration.Configure(modelBuilder);

        // These tables were removed from Core. Keeping their CLR types allows
        // older contracts to compile, but excludes them from the EF model so
        // migrations and normal startup no longer expect the tables.
        modelBuilder.Ignore<Approver>();
        modelBuilder.Ignore<DocumentSetting>();
        modelBuilder.Ignore<FiscalYear>();
        modelBuilder.Ignore<Notification>();
        modelBuilder.Ignore<ModuleDataSet>();
        modelBuilder.Ignore<VoucherStatus>();
        modelBuilder.Ignore<VoucherTransaction>();
        modelBuilder.Ignore<Workflow>();
        modelBuilder.Ignore<WorkflowProfile>();
    }
}
