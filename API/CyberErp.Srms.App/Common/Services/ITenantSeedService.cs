namespace CyberErp.Srms.App.Common.Services
{
    /// <summary>
    /// Service for seeding default data when a new tenant is created
    /// </summary>
    public interface ITenantSeedService
    {
        /// <summary>
        /// Seeds all required default data for a new tenant
        /// </summary>
        /// <param name="tenantId">The tenant ID to seed data for</param>
        /// <param name="createdBy">User who triggered the seed (usually the registering user)</param>
        /// <param name="cancellationToken">Cancellation token</param>
        Task SeedTenantDataAsync(string tenantId, string? createdBy = null, CancellationToken cancellationToken = default);
    }
}
