using FluentValidation;
using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;
using CyberErp.Srms.App.Features.Core.UserRoles.Create;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.UserRoles.Create
{
    public class CreateUserRole(
        ICreateUserRoleRepository userRoleRepository,
        IValidator<UserRoleDto> validator,
        ILogger<CreateUserRole> logger) : ICreateUserRole
    {
        private readonly ICreateUserRoleRepository _userRoleRepository = userRoleRepository;
        private readonly IValidator<UserRoleDto> _validator = validator;
        private readonly ILogger<CreateUserRole> _logger = logger;

        public async Task<UserRoleResult> CreateAsync(UserRoleDto dto)
        {
            _logger.LogInformation("Creating UserRole with UserId: {UserId}", dto.UserId);

            var validationResult = await _validator.ValidateAsync(dto);
            if (!validationResult.IsValid)
            {
                _logger.LogWarning("UserRole creation failed validation for UserId: {UserId}", dto.UserId);
                throw new FluentValidation.ValidationException(validationResult.Errors);
            }

            return await _userRoleRepository.CreateAsync(dto);
        }
    }
}

