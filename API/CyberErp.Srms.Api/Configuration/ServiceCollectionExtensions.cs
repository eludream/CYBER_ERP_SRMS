using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using FluentValidation;
using NodaTime;
using NodaTime.Serialization.SystemTextJson;
using System.Reflection;
using Finbuckle.MultiTenant;
using Finbuckle.MultiTenant.AspNetCore.Extensions;
using Finbuckle.MultiTenant.Extensions;
using CyberErp.Srms.Inf;
using CyberErp.Srms.Inf.Models;
using CyberErp.Srms.Inf.MultiTenant;
using CyberErp.Srms.App;
using CyberErp.Srms.App.Common.DTOs;

namespace CyberErp.Srms.Api.Configuration;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddSrmsDataProtection(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        var configuredPath = configuration["DataProtection:KeysPath"];
        var keysPath = string.IsNullOrWhiteSpace(configuredPath)
            ? Path.Combine(environment.ContentRootPath, "App_Data", "DataProtection-Keys")
            : Path.IsPathRooted(configuredPath)
                ? configuredPath
                : Path.GetFullPath(configuredPath, environment.ContentRootPath);

        Directory.CreateDirectory(keysPath);

        services.AddDataProtection()
            .SetApplicationName("CyberErp.Srms")
            .PersistKeysToFileSystem(new DirectoryInfo(keysPath));

        return services;
    }

    public static IServiceCollection AddSrmsForwardedHeaders(this IServiceCollection services)
    {
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.KnownNetworks.Clear();
            options.KnownProxies.Clear();
        });

        return services;
    }

    public static IServiceCollection AddSrmsSession(this IServiceCollection services)
    {
        services.AddDistributedMemoryCache();
        services.AddSession(options =>
        {
            options.IdleTimeout = TimeSpan.FromMinutes(30);
            options.Cookie.HttpOnly = true;
            options.Cookie.IsEssential = true;
            options.Cookie.Name = ".CyberErp.Srms.Session";
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        });

        return services;
    }

    public static IServiceCollection AddSrmsControllers(this IServiceCollection services)
    {
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.ConfigureForNodaTime(DateTimeZoneProviders.Tzdb);
            });

        return services;
    }

    public static IServiceCollection AddSrmsCors(this IServiceCollection services, IConfiguration configuration)
    {
        var corsOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
            
        services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                policy.WithOrigins(corsOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        return services;
    }

    public static IServiceCollection AddSrmsValidators(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<GetAllRequest>();
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        return services;
    }

    public static IServiceCollection AddSrmsDbContext(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        services.AddDbContext<SrmsDbContext>(options =>
        {
            options.UseSqlServer(connectionString, b => b.MigrationsAssembly("CyberErp.Srms.Inf"));
        });
        services.AddScoped<DbContext>(sp => sp.GetRequiredService<SrmsDbContext>());

        return services;
    }

    public static IServiceCollection AddSrmsMultiTenancy(this IServiceCollection services)
    {
        services.AddMultiTenant<AppTenantInfo>()
            .WithStrategy<HybridTenantStrategy>(ServiceLifetime.Scoped)
            .WithStore<DatabaseTenantStore>(ServiceLifetime.Scoped);

        return services;
    }

    public static IServiceCollection AddSrmsSwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.CustomSchemaIds(type => type.FullName?.Replace("+", "."));
        });

        return services;
    }

    public static IServiceCollection AddSrmsApiVersioning(this IServiceCollection services)
    {
        services.AddApiVersioning(options =>
        {
            options.DefaultApiVersion = new Microsoft.AspNetCore.Mvc.ApiVersion(1, 0);
            options.AssumeDefaultVersionWhenUnspecified = true;
            options.ReportApiVersions = true;
        });

        services.AddVersionedApiExplorer(options =>
        {
            options.GroupNameFormat = "'v'VVV";
            options.SubstituteApiVersionInUrl = true;
        });

        return services;
    }
}
