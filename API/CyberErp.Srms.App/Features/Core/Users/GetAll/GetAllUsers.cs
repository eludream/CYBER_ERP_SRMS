using FluentValidation;
using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Features.Core.Users.DTOs;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Users.GetAll
{
    public class GetAllUsers(
        IGetAllUserRepository repository,
        IValidator<GetAllRequest> validator,
        ILogger<GetAllUsers> logger) : IGetAllUsers
    {
        private readonly IGetAllUserRepository _repository = repository;
        private readonly IValidator<GetAllRequest> _validator = validator;
        private readonly ILogger<GetAllUsers> _logger = logger;

        public async Task<PaginatedResponse<UserDto>> GetAllAsync(GetAllRequest request)
        {
            var validationResult = await _validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                _logger.LogWarning("Get all Users failed validation for request parameters");
                throw new ValidationException(validationResult.Errors);
            }
            var result = await _repository.GetAllAsync(request);
            return result;

        }
    }
}

