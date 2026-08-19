using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.App.Features.Core.LoginTrails.GetById;
using CyberErp.Srms.App.Features.Core.LoginTrails.GetAll;
using CyberErp.Srms.App.Features.Core.Modules.GetAll;
using CyberErp.Srms.App.Features.Core.Operations.GetAll;
using CyberErp.Srms.App.Features.Core.Operations.Delete;
using CyberErp.Srms.App.Features.Core.VoucherTransactions.GetAll;
using CyberErp.Srms.App.Features.Core.Workflows.GetAll;
using CyberErp.Srms.App.Features.Core.DocumentSettings.GetAll;
using CyberErp.Srms.App.Features.Core.Notifications.GetAll;
using CyberErp.Srms.App.Features.Core.Settings.GetAll;
using CyberErp.Srms.App.Features.Core.Tenants.GetAll;
using CyberErp.Srms.App.Features.Core.SubscriptionPlans.Create;
using CyberErp.Srms.App.Features.Core.Users.GetCurrentUser;
using CyberErp.Srms.App.Features.Core.Users.Login;
using CyberErp.Srms.App.Features.Core.Users.Register;
using CyberErp.Srms.App.Features.Core.UserRoles.GetAll;
using CyberErp.Srms.Inf.Common;
using CyberErp.Srms.Inf.Common.Services;
using CyberErp.Srms.Inf.Models;
using CyberErp.Srms.Inf.Repositories;
using CyberErp.Srms.Inf.Repositories.Core.Modules;
using CyberErp.Srms.Inf.Repositories.Core.Operations;
using CyberErp.Srms.Inf.Repositories.Core.Approvers;
using CyberErp.Srms.Inf.Repositories.Core.UserRoles;
using CyberErp.Srms.Inf.Repositories.Core.Workflows;
using CyberErp.Srms.Inf.Repositories.Core.VoucherTransactions;
using CyberErp.Srms.Inf.Repositories.Core.DocumentSettings;
using CyberErp.Srms.Inf.Repositories.Core.Notifications;
using CyberErp.Srms.Inf.Repositories.Core.Tenants;
using CyberErp.Srms.Inf.Repositories.Core.Settings;
using CyberErp.Srms.Inf.Repositories.Core.LoginTrails;
using CyberErp.Srms.Inf.Repositories.Core.Users;
using CyberErp.Srms.Inf.Repositories.Core.SubscriptionPlans;
using Microsoft.Extensions.DependencyInjection;
using CyberErp.Srms.App.Features.Core.Approvers.Approve;
using CyberErp.Srms.App.Features.Core.Approvers.Reject;
using CyberErp.Srms.App.Features.Core.Approvers.GetAll;
using CyberErp.Srms.App.Features.Core.Modules.GetOperations;

namespace CyberErp.Srms.Inf;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastractureServices(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ITenantService, TenantService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        services.AddScoped<IExceptionHandler, ExceptionHandler>();

        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IAuthentication, Authentication>();
        services.AddScoped<IMultiTenantControlPlaneService, MultiTenantControlPlaneService>();
        services.AddScoped<ITokenStore, TokenStore>();
        services.AddScoped<IDocument, Document>();
        services.AddScoped<IStatus, Status>();
        services.AddScoped<VoucherNotificationService>();
        services.AddScoped<INextStepNotifier, NextStepNotifier>();

        // Approvers
        services.AddScoped<IApproveRepository, ApproveRepository>();
        services.AddScoped<IRejectRepository, RejectRepository>();
        services.AddScoped<IGetAllApproversRepository, GetAllApproversRepository>();
        services.AddScoped<VoucherStatusUpdater>();

        // LoginTrails
        services.AddScoped<IGetAllLoginTrailRepository, GetAllLoginTrailRepository>();
        services.AddScoped<IGetLoginTrailByIdRepository, GetLoginTrailByIdRepository>();

        // Modules - GetAll using repository pattern
        services.AddScoped<IGetAllModuleRepository, GetAllModuleRepository>();
        services.AddScoped<IGetModuleWithOperationsRepository, GetModuleWithOperationsRepository>();

        // UserRoles - GetAll using repository pattern
        services.AddScoped<IGetAllUserRoleRepository, GetAllUserRoleRepository>();

        // Operations - GetAll using repository pattern
        services.AddScoped<IGetAllOperationsRepository, GetAllOperationsRepository>();
        services.AddScoped<IDeleteOperationRepository, DeleteOperationRepository>();

        // Workflows - GetAll using repository pattern
        services.AddScoped<IGetAllWorkflowsRepository, GetAllWorkflowsRepository>();

        // VoucherTransactions - GetAll using repository pattern
        services.AddScoped<IGetAllVoucherTransactionsRepository, GetAllVoucherTransactionsRepository>();

        // Notifications - GetAll using repository pattern
        services.AddScoped<IGetAllNotificationsRepository, GetAllNotificationsRepository>();

        // DocumentSettings - GetAll using repository pattern
        services.AddScoped<IGetAllDocumentSettingsRepository, GetAllDocumentSettingsRepository>();

        // Settings - GetAll using repository pattern
        services.AddScoped<IGetAllSettingsRepository, GetAllSettingsRepository>();

        // Tenants - GetAll using repository pattern
        services.AddScoped<IGetAllTenantsRepository, GetAllTenantsRepository>();

        // SubscriptionPlans
        services.AddScoped<ICreateSubscriptionPlanRepository, CreateSubscriptionPlanRepository>();

        // Users
        services.AddScoped<IGetCurrentUserRepository, GetCurrentUserRepository>();
        services.AddScoped<ILoginRepository, CyberErp.Srms.Inf.Repositories.Core.LoginRepository>();
        services.AddScoped<IRegisterRepository, RegisterRepository>();
        services.AddScoped<ITokenParser, TokenParser>();
        services.AddScoped<ITenantSeedService, TenantSeedService>();

        return services;
    }
}
