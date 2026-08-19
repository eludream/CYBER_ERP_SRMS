using CyberErp.Srms.App;
using CyberErp.Srms.Inf;
using CyberErp.Srms.Api.Configuration;
using CyberErp.Srms.Inf.Models;
using CyberErp.Srms.App.Common.Services;
using Serilog;


Log.Logger = new LoggerConfiguration()
    .ConfigureSerilog()
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog();

builder.Services
    .AddSrmsForwardedHeaders()
    .AddSrmsDataProtection(builder.Configuration, builder.Environment)
    .AddSrmsSession()
    .AddSrmsAuthentication(builder.Configuration)
    .AddSrmsControllers()
    .AddSrmsCors(builder.Configuration)
    .AddSrmsValidators()
    .AddSrmsDbContext(builder.Configuration)
    .AddSrmsMultiTenancy()
    .AddInfrastractureServices()
    .AddApplicationServices()
    .AddSrmsSwagger()
    .AddSrmsApiVersioning();

var app = builder.Build();

app.UseSrmsSwagger(app.Environment);
app.UseSrmsMiddlewarePipeline();

app.Run();
