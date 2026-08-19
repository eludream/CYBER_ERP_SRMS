using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.Dom.Constants;
using CyberErp.Srms.Dom.Entities;
using CyberErp.Srms.Dom.Entities.Core;
using VoucherStatusEntity = CyberErp.Srms.Dom.Entities.Core.VoucherStatus;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NodaTime;

namespace CyberErp.Srms.Inf.Common;

public class TenantSeedService : ITenantSeedService
{
    private readonly IRepository<Module> _moduleRepository;
    private readonly IRepository<Operation> _operationRepository;
    private readonly IRepository<Role> _roleRepository;
    private readonly IRepository<DocumentSetting> _documentSettingRepository;
    private readonly IRepository<Workflow> _workflowRepository;
    private readonly IRepository<FiscalYear> _fiscalYearRepository;
    private readonly IRepository<VoucherStatusEntity> _voucherStatusRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<UserRole> _userRoleRepository;
    private readonly IAuthentication _authentication;
    private readonly ILogger<TenantSeedService> _logger;

    public TenantSeedService(
        IRepository<Module> moduleRepository,
        IRepository<Operation> operationRepository,
        IRepository<Role> roleRepository,
        IRepository<DocumentSetting> documentSettingRepository,
        IRepository<Workflow> workflowRepository,
        IRepository<FiscalYear> fiscalYearRepository,
        IRepository<VoucherStatusEntity> voucherStatusRepository,
        IRepository<User> userRepository,
        IRepository<UserRole> userRoleRepository,
        IAuthentication authentication,
        ILogger<TenantSeedService> logger)
    {
        _moduleRepository = moduleRepository;
        _operationRepository = operationRepository;
        _roleRepository = roleRepository;
        _documentSettingRepository = documentSettingRepository;
        _workflowRepository = workflowRepository;
        _fiscalYearRepository = fiscalYearRepository;
        _voucherStatusRepository = voucherStatusRepository;
        _userRepository = userRepository;
        _userRoleRepository = userRoleRepository;
        _authentication = authentication;
        _logger = logger;
    }

    public async Task SeedTenantDataAsync(string tenantId, string? createdBy = null, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting tenant data seeding for TenantId: {TenantId}", tenantId);

        try
        {
            await SeedVoucherStatusesAsync(tenantId, createdBy);
            await SeedModulesAsync(tenantId, createdBy);
            await SeedFiscalYearAsync(tenantId, createdBy);
            await SeedDocumentSettingsAsync(tenantId, createdBy);
            await SeedWorkflowsAsync(tenantId, createdBy);
            await SeedRolesAsync(tenantId, createdBy);
            await SeedDefaultUserAsync(tenantId, createdBy);
            await SeedUserRolesAsync(tenantId, createdBy);

            _logger.LogInformation("Tenant data seeding completed for TenantId: {TenantId}", tenantId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding tenant data for TenantId: {TenantId}", tenantId);
            throw;
        }
    }

    private async Task SeedVoucherStatusesAsync(string tenantId, string? createdBy)
    {
        // Check if statuses already exist for this tenant
        var existingStatuses = await _voucherStatusRepository.GetAll()
            .AnyAsync(s => s.TenantId == tenantId);
        
        if (existingStatuses)
        {
            _logger.LogInformation("Voucher statuses already exist for TenantId: {TenantId}", tenantId);
            return;
        }

        var statuses = new List<VoucherStatusEntity>
        {
            VoucherStatusEntity.Create("Draft", "DRAFT"),
            VoucherStatusEntity.Create("Pending", "PENDING"),
            VoucherStatusEntity.Create("Posted", "POSTED"),
            VoucherStatusEntity.Create("Approved", "APPROVED"),
            VoucherStatusEntity.Create("Rejected", "REJECTED"),
            VoucherStatusEntity.Create("Cancelled", "CANCELLED"),
            VoucherStatusEntity.Create("Closed", "CLOSED"),
            VoucherStatusEntity.Create("Done", "DONE")
        };

        foreach (var status in statuses)
        {
            status.TenantId = tenantId;
            status.Create(createdBy);
        }

        _voucherStatusRepository.AddRange(statuses);
        await _voucherStatusRepository.SaveChangesAsync();
    }

    private async Task SeedModulesAsync(string tenantId, string? createdBy)
    {
        // Check if modules already exist for this tenant
        var existingModules = await _moduleRepository.GetAll()
            .AnyAsync(m => m.TenantId == tenantId);
        
        if (existingModules)
        {
            _logger.LogInformation("Modules already exist for TenantId: {TenantId}", tenantId);
            return;
        }

        var catalogModules = new List<Module>
        {
            Module.Create("finance", "ERP", "Finance", "General Ledger, Invoicing, Chart of Accounts, Assets, Tax", "/finance/dashboard", "dollar-sign", 10),
            Module.Create("inventory", "ERP", "Inventory", "Stock Tracking, Warehousing, Valuation, Replenishment", "/inventory/dashboard", "package", 20),
            Module.Create("hr", "ERP", "Human Resources", "Hire-to-Retire lifecycle, Payroll, Talent Management", "/hr/dashboard", "users", 30),
            Module.Create("sales", "ERP", "Sales", "CRM, Leads, Quotations, Orders, Shipping, Invoicing, Commissions", "/sales/dashboard", "shopping-cart", 40),
            Module.Create("procurement", "ERP", "Procurement", "Procure-to-Pay, Supplier Management, Contracts, Spend Analytics", "/procurement/dashboard", "truck", 50),
            Module.Create("production", "ERP", "Production", "BOM, Work Orders, Scheduling, Costing, Quality, Analytics", "/production/dashboard", "factory", 60),
            Module.Create("quality", "ERP", "Quality Control", "Inspections, NCRs, CAPA, Audits, SPC, Calibration, Document Control", "/quality/dashboard", "shield", 70),
            Module.Create("reports", "ERP", "Reports & Analytics", "Dashboards, Custom Reports, Analytics", "/reports/dashboard", "bar-chart-3", 80),
            Module.Create("002", "ERP", "Security and Admin Management System", "User Roles, Permissions, System Logs", "/security/users", "lock", 90, true, "SAMS"),
            Module.Create("workflow", "ERP", "Workflow", "Approval Chains, Task Tracking, Automation Rules, Designer", "/workflow/dashboard", "git-branch", 100),
            Module.Create("forms", "ERP", "Form Designer", "Build, manage, and deploy dynamic forms across all ERP modules", "/forms", "form-input", 110)
        };
        foreach (var module in catalogModules)
        {
            module.TenantId = tenantId;
            module.Create(createdBy);
        }
        _moduleRepository.AddRange(catalogModules);

        var administrationModule = Module.Create("administration", "Admin", "Administration", "Core administration operations", "/security/users", "settings", 1000, false);
        administrationModule.TenantId = tenantId;
        administrationModule.Create(createdBy);

        await _moduleRepository.AddAsync(administrationModule);
        await _moduleRepository.SaveChangesAsync();

        var operations = new List<Operation>
        {
            Operation.Create(administrationModule.Id, "Role", "role", "Manage Roles", "RL"),
            Operation.Create(administrationModule.Id, "Operation", "operation", "Manage Operations", "OP"),
            Operation.Create(administrationModule.Id, "Module", "module", "Manage Modules", "MD"),
            Operation.Create(administrationModule.Id, "User", "user", "Manage Users", "US"),
            Operation.Create(administrationModule.Id, "User Role", "userRole", "Manage User Roles", "UR"),
            Operation.Create(administrationModule.Id, "Role Permission", "rolePermission", "Manage Role Permissions", "RP"),
            Operation.Create(administrationModule.Id, "Document Setting", "documentSetting", "Manage Document Settings", "DS"),
            Operation.Create(administrationModule.Id, "Work Flow", "workflow", "Manage Work Flows", "WF"),
            Operation.Create(administrationModule.Id, "Approver", "approver", "Manage Approvers", "AP"),
            Operation.Create(administrationModule.Id, "Fiscal Year", "fiscalYear", "Manage Fiscal Years", "FY"),
            Operation.Create(administrationModule.Id, "Setting", "setting", "Manage Settings", "SE")
        };

        foreach (var operation in operations)
        {
            operation.TenantId = tenantId;
            operation.Create(createdBy);
        }

        _operationRepository.AddRange(operations);
        await _operationRepository.SaveChangesAsync();
    }

    private async Task SeedFiscalYearAsync(string tenantId, string? createdBy)
    {
        var currentYear = SystemClock.Instance.GetCurrentInstant().InUtc().Year;
        
        // Check if fiscal year already exists for this tenant
        var existingFiscalYear = await _fiscalYearRepository.GetAll()
            .AnyAsync(fy => fy.TenantId == tenantId && fy.Name == $"FY {currentYear}");
        
        if (existingFiscalYear)
        {
            _logger.LogInformation("Fiscal year already exists for TenantId: {TenantId}", tenantId);
            return;
        }

        var fiscalYear = FiscalYear.Create(
            name: $"FY {currentYear}",
            startDate: Instant.FromUtc(currentYear, 1, 1, 0, 0),
            endDate: Instant.FromUtc(currentYear, 12, 31, 23, 59, 59),
            isActive: true);

        fiscalYear.TenantId = tenantId;
        fiscalYear.Create(createdBy);

        await _fiscalYearRepository.AddAsync(fiscalYear);
        await _fiscalYearRepository.SaveChangesAsync();
    }

    private async Task SeedDocumentSettingsAsync(string tenantId, string? createdBy)
    {
        // Check if document settings already exist for this tenant
        var existingSettings = await _documentSettingRepository.GetAll()
            .AnyAsync(ds => ds.TenantId == tenantId);
        
        if (existingSettings)
        {
            _logger.LogInformation("Document settings already exist for TenantId: {TenantId}", tenantId);
            return;
        }

        var documentSettings = new List<DocumentSetting>
        {
            DocumentSetting.Create(VoucherDocument.PurchaseOrder, "PO", null, null, 0),
            DocumentSetting.Create(VoucherDocument.SalesOrder, "SO", null, null, 0)
        };

        foreach (var setting in documentSettings)
        {
            setting.TenantId = tenantId;
            ((BaseEntity)setting).Create(createdBy);
        }

        _documentSettingRepository.AddRange(documentSettings);
        await _documentSettingRepository.SaveChangesAsync();
    }

    private async Task SeedWorkflowsAsync(string tenantId, string? createdBy)
    {
        // Check if workflows already exist for this tenant
        var existingWorkflows = await _workflowRepository.GetAll()
            .AnyAsync(w => w.TenantId == tenantId);
        
        if (existingWorkflows)
        {
            _logger.LogInformation("Workflows already exist for TenantId: {TenantId}", tenantId);
            return;
        }

        var postedStatus = await _voucherStatusRepository.GetAll().FirstOrDefaultAsync(s => s.Code == "POSTED");
        if (postedStatus == null)
        {
            _logger.LogWarning("Could not find voucher statuses for workflow seeding");
            return;
        }

        var workflows = new List<Workflow>
        {
            Workflow.Create(1, VoucherDocument.PurchaseOrder, postedStatus.Id),
            Workflow.Create(1, VoucherDocument.SalesOrder, postedStatus.Id)
        };

        foreach (var workflow in workflows)
        {
            workflow.TenantId = tenantId;
            workflow.Create(createdBy);
        }

        _workflowRepository.AddRange(workflows);
        await _workflowRepository.SaveChangesAsync();
    }

    private async Task SeedRolesAsync(string tenantId, string? createdBy)
    {
        // Check if admin role already exists for this tenant
        var existingRole = await _roleRepository.GetAll()
            .AnyAsync(r => r.TenantId == tenantId && r.Code == "ADMIN");
        
        if (existingRole)
        {
            _logger.LogInformation("Admin role already exists for TenantId: {TenantId}", tenantId);
            return;
        }

        var operations = await _operationRepository.GetAll().Where(o => o.TenantId == tenantId).ToListAsync();
        var adminRole = Role.Create("Administrator", "ADMIN");
        adminRole.TenantId = tenantId;
        ((BaseEntity)adminRole).Create(createdBy);

        foreach (var operation in operations)
        {
            adminRole.AddPermission(operation.Id, true, true, true, true, true);
        }

        foreach (var permission in adminRole.RolePermissions)
        {
            permission.TenantId = tenantId;
            permission.Create(createdBy);
        }

        await _roleRepository.AddAsync(adminRole);
        await _roleRepository.SaveChangesAsync();
    }

    private async Task SeedDefaultUserAsync(string tenantId, string? createdBy)
    {
        var defaultEmail = $"admin@{tenantId}.com";
        var defaultUserName = "admin";
        
        var existingUser = await _userRepository.GetAll()
            .FirstOrDefaultAsync(u => u.TenantId == tenantId && u.UserName == defaultUserName);
        
        if (existingUser != null)
        {
            _logger.LogInformation("Default admin user already exists for TenantId: {TenantId}", tenantId);
            return;
        }

        var defaultPassword = "Admin@123"; // Default password - should be changed on first login
        var hashedPassword = _authentication.EncryptPassword(defaultPassword);

        var adminUser = User.Create(
            fullName: "System Administrator",
            email: defaultEmail,
            phoneNumber: "0000000000",
            userName: defaultUserName,
            password: hashedPassword
        );

        adminUser.TenantId = tenantId;
        ((BaseEntity)adminUser).Create(createdBy);

        await _userRepository.AddAsync(adminUser);
        await _userRepository.SaveChangesAsync();

        _logger.LogInformation("Default admin user created for TenantId: {TenantId}, Username: {UserName}", tenantId, defaultUserName);
    }

    private async Task SeedUserRolesAsync(string tenantId, string? createdBy)
    {
        var adminRole = await _roleRepository.GetAll().FirstOrDefaultAsync(r => r.Code == "ADMIN" && r.TenantId == tenantId);
        if (adminRole == null)
        {
            _logger.LogWarning("Admin role not found for TenantId: {TenantId}, skipping user role seeding", tenantId);
            return;
        }

        var users = await _userRepository.GetAll().Where(u => u.TenantId == tenantId).ToListAsync();
        foreach (var user in users)
        {
            var exists = await _userRoleRepository.GetAll()
                .AnyAsync(ur => ur.UserId == user.Id && ur.RoleId == adminRole.Id);
            if (exists)
            {
                continue;
            }

            var userRole = UserRole.Create(adminRole.Id, user.Id);
            userRole.TenantId = tenantId;
            userRole.Create(createdBy);
            await _userRoleRepository.AddAsync(userRole);
        }

        await _userRoleRepository.SaveChangesAsync();
    }
}
