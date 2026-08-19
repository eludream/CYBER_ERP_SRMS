using FluentValidation;

namespace CyberErp.Srms.App.Features.Core.Users.DTOs;

public class UserDto
{
    public Guid Id { get; set; }
    public Guid? EmployeeId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
}

public class LoginUserDto
{
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginUserDtoValidator : AbstractValidator<LoginUserDto>
{
    public LoginUserDtoValidator()
    {
        RuleFor(x => x.UserName)
            .NotEmpty().WithMessage("UserName is required.")
            .MaximumLength(100).WithMessage("UserName must not exceed 100 characters.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.");
    }
}

public class UserResult
{
    public Guid Id { get; set; }
    public Guid? EmployeeId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string UserName { get; set; } = string.Empty;
    public Guid? CompanyId { get; set; }
    public Guid? TenantId { get; set; }
    public bool IsPlatformAdministrator { get; set; }
    public string Token { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public int SessionTimeoutMinutes { get; set; } = 30;
}
