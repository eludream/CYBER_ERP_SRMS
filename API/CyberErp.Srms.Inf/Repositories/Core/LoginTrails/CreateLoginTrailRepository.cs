using System.Collections.Generic;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.App.Features.Core.LoginTrails.Create;
using CyberErp.Srms.App.Features.Core.LoginTrails.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.Inf.Repositories.Core.LoginTrails
{
    public class CreateLoginTrailRepository(
        IRepository<LoginTrail> loginTrailRepository,
        ILogger<CreateLoginTrailRepository> logger,
        IExceptionHandler exceptionHandler) : ICreateLoginTrailRepository
    {
        private readonly IRepository<LoginTrail> _loginTrailRepository = loginTrailRepository;
        private readonly ILogger<CreateLoginTrailRepository> _logger = logger;
        private readonly IExceptionHandler _exceptionHandler = exceptionHandler;

        public async Task<LoginTrailResult> CreateAsync(LoginTrailDto dto)
        {
            
                _logger.LogInformation("Creating LoginTrail with IP: {IpAddress}", dto.IpAddress);

                var loginTrail = LoginTrail.Create(
                    dto.UserId,
                    dto.Date,
                    dto.IpAddress,
                    dto.Status);

                await _loginTrailRepository.AddAsync(loginTrail);
                await _loginTrailRepository.SaveChangesAsync();

                _logger.LogInformation("LoginTrail created successfully with ID: {Id}", loginTrail.Id);

                return new LoginTrailResult { Id = loginTrail.Id };
            }

        }
    }
