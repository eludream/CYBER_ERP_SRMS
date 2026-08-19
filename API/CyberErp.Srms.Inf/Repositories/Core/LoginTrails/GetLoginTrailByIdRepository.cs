using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.App.Features.Core.LoginTrails.DTOs;
using CyberErp.Srms.App.Features.Core.LoginTrails.GetById;
using CyberErp.Srms.Dom.Entities.Core;
using CyberErp.Srms.Inf.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.Inf.Repositories.Core.LoginTrails
{
    public class GetLoginTrailByIdRepository(
        IRepository<LoginTrail> loginTrailRepository,
        ILogger<GetLoginTrailByIdRepository> logger) : IGetLoginTrailByIdRepository
    {
        private readonly IRepository<LoginTrail> _loginTrailRepository = loginTrailRepository;
        private readonly ILogger<GetLoginTrailByIdRepository> _logger = logger;
        public async Task<LoginTrailDto> GetByIdAsync(Guid id)
        {
            
            _logger.LogInformation("Getting LoginTrail by ID: {Id}", id);

            var loginTrail = await _loginTrailRepository.GetAll()
                .FirstOrDefaultAsync(lt => lt.Id == id);

            if (loginTrail == null)
            {
                _logger.LogWarning("LoginTrail with ID {Id} not found", id);
                throw new NotFoundException(nameof(LoginTrail), id.ToString());
            }

            return new LoginTrailDto
            {
                Id = loginTrail.Id,
                UserId = loginTrail.UserId,
                Date = loginTrail.Date,
                IpAddress = loginTrail.IpAddress,
                Status = loginTrail.Status
            };
            }

    }
}
