
using CyberErp.Srms.App.Features.Core.LoginTrails.DTOs;
using CyberErp.Srms.App.Features.Core.LoginTrails.GetById;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.LoginTrails.GetById
{
    public class GetLoginTrailById(
        IGetLoginTrailByIdRepository repository,
        ILogger<GetLoginTrailById> logger) : IGetLoginTrailById
    {
        private readonly IGetLoginTrailByIdRepository _repository = repository;
        private readonly ILogger<GetLoginTrailById> _logger = logger;

        public async Task<LoginTrailDto> GetByIdAsync(Guid id)
        {
            _logger.LogInformation("Getting LoginTrail with ID: {Id}", id);
            return await _repository.GetByIdAsync(id);
        }
    }
}

