using System.Collections.Generic;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.App.Features.Core.LoginTrails.Delete;
using CyberErp.Srms.App.Features.Core.LoginTrails.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.Inf.Repositories.Core.LoginTrails
{
    public class DeleteLoginTrailRepository(
        IRepository<LoginTrail> loginTrailRepository,
        ILogger<DeleteLoginTrailRepository> logger) : IDeleteLoginTrailRepository
    {
        private readonly IRepository<LoginTrail> _loginTrailRepository = loginTrailRepository;
        private readonly ILogger<DeleteLoginTrailRepository> _logger = logger;
        public async Task<LoginTrailResult> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            
            _logger.LogInformation("Deleting LoginTrail with ID: {Id}", id);

            var loginTrail = await _loginTrailRepository.GetByIdAsync(id);
            if (loginTrail is null)
            {
                _logger.LogError("LoginTrail not found for Id: {Id}", id);
                throw new NotFoundException(nameof(LoginTrail), id.ToString());
            }

            _loginTrailRepository.Delete(loginTrail);
            await _loginTrailRepository.SaveChangesAsync();
            await _loginTrailRepository.SaveChangesAsync();

            _logger.LogInformation("LoginTrail deleted successfully with ID: {Id}", id);

            return new LoginTrailResult { Id = id };
            }

    }
}
