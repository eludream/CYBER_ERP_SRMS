
using CyberErp.Srms.App.Features.Core.LoginTrails.DTOs;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.LoginTrails.Delete
{
    public class DeleteLoginTrail(
        IDeleteLoginTrailRepository LoginTrailRepository,
        ILogger<DeleteLoginTrail> logger
        ) : IDeleteLoginTrail
    {
        private readonly IDeleteLoginTrailRepository _LoginTrailRepository = LoginTrailRepository;
        private readonly ILogger<DeleteLoginTrail> _logger = logger;

        public async Task<LoginTrailResult> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Deleting LoginTrail with Id: {Id}", id);
            return await _LoginTrailRepository.DeleteAsync(id, cancellationToken);
        }
    }
}

