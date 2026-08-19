using FluentValidation;
using CyberErp.Srms.App.Features.Core.UserRoles.DTOs;
using CyberErp.Srms.App.Features.Core.UserRoles.Update;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.UserRoles.Update
{
    public class UpdateUserRole(
        IUpdateUserRoleRepository userRoleRepository,
        IValidator<UserRoleDto> validator,
        ILogger<UpdateUserRole> logger) : IUpdateUserRole
    {
        private readonly IUpdateUserRoleRepository _userRoleRepository = userRoleRepository;
        private readonly IValidator<UserRoleDto> _validator = validator;
        private readonly ILogger<UpdateUserRole> _logger = logger;

        public async Task<UserRoleResult> UpdateAsync(UserRoleDto dto)
        {
            _logger.LogInformation("Updating UserRole with ID: {Id}", dto.Id);

            var validationResult = await _validator.ValidateAsync(dto);
            if (!validationResult.IsValid)
            {
                _logger.LogWarning("UserRole update failed validation for ID: {Id}", dto.Id);
                throw new FluentValidation.ValidationException(validationResult.Errors);
            }

            return await _userRoleRepository.UpdateAsync(dto);
        }
    }
}

