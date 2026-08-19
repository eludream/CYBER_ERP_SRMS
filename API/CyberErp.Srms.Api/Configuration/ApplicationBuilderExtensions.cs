using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Finbuckle.MultiTenant.AspNetCore.Extensions;
using CyberErp.Srms.Api.Middleware;
using CyberErp.Srms.Api.Endpoints;

namespace CyberErp.Srms.Api.Configuration
{

    public static class ApplicationBuilderExtensions
    {
        public static IApplicationBuilder UseSrmsSwagger(this IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            return app;
        }

        public static WebApplication UseSrmsMiddlewarePipeline(this WebApplication app)
        {
            app.UseMiddleware<ExceptionMiddleware>();
            app.UseForwardedHeaders();
            app.UseRouting();
            app.UseCors("AllowFrontend");
            app.UseSession();
            app.UseSrmsAuthentication();
            app.UseMultiTenant();
            app.UseAuthorization();
            app.UseMiddleware<TenantAuthorizationMiddleware>();

            app.MapControllers();
            app.MapAccountEndpoints();

            app.MapGet("/test-cors", () => new { Message = "CORS test successful!", Timestamp = DateTime.UtcNow })
               .RequireCors("AllowFrontend");

            return app;
        }
    }
}
