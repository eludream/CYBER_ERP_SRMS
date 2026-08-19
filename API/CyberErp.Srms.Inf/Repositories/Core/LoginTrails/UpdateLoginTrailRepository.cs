using System.Collections.Generic;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.App.Features.Core.LoginTrails.DTOs;
using CyberErp.Srms.App.Features.Core.LoginTrails.Update;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.Inf.Repositories.Core.LoginTrails
{
    public class UpdateLoginTrailRepository(
        IRepository<LoginTrail> loginTrailRepository,
        ILogger<UpdateLoginTrailRepository> logger) : IUpdateLoginTrailRepository
    {
        private readonly IRepository<LoginTrail> _loginTrailRepository = loginTrailRepository;
        private readonly ILogger<UpdateLoginTrailRepository> _logger = logger;
        public async Task<LoginTrailResult> UpdateAsync(UpdateLoginTrailDto dto)
        {
            
            _logger.LogInformation("Updating LoginTrail with ID: {Id}", dto.Id);

            var loginTrail = await _loginTrailRepository.GetAll()
                .FirstOrDefaultAsync(x => x.Id == dto.Id);
            if (loginTrail is null)
            {
                _logger.LogError("LoginTrail not found for Id: {Id}", dto.Id);
                throw new NotFoundException(nameof(LoginTrail), dto.Id.ToString());
            }

            loginTrail.Update(
                dto.UserId,
                dto.Date,
                dto.IpAddress,
                dto.Status);

            _loginTrailRepository.UpdateAsync(loginTrail);
            await _loginTrailRepository.SaveChangesAsync();

            _logger.LogInformation("LoginTrail updated successfully with ID: {Id}", loginTrail.Id);

            return new LoginTrailResult { Id = loginTrail.Id };
            }

    }
}
