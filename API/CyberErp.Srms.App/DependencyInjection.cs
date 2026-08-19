using Microsoft.Extensions.DependencyInjection;
using FluentValidation;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Features.Core.FiscalYears.GetAll;
using CyberErp.Srms.App.Features.Core.Users.Login;
using CyberErp.Srms.App.Features.Core.Users.Logout;
using CyberErp.Srms.App.Features.Core.Users.GetCurrentUser;
using CyberErp.Srms.App.Features.Core.Users.Register;

namespace CyberErp.Srms.App
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            // Users - Auth
            services.AddScoped<ILoginUser, LoginUser>();
            services.AddScoped<ILogoutUser, LogoutUser>();
            services.AddScoped<ILogoutCookieUser, LogoutCookieHandler>();
            services.AddScoped<IRegisterUser, RegisterUser>();
            services.AddScoped<IRegisterWithGoogle, RegisterWithGoogle>();
            services.AddScoped<IGetCurrentUser, GetCurrentUser>();

            services.Scan(scan => scan
                .FromAssemblyOf<GetAllFiscalYearsHandler>()
                .AddClasses(c => c.AssignableTo(typeof(IFeatureHandler<,>)))
                .AsImplementedInterfaces()
                .WithScopedLifetime());

            services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

            return services;
        }
    }
}