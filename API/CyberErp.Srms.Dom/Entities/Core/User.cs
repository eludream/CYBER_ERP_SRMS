
namespace CyberErp.Srms.Dom.Entities.Core;

public class User : BaseEntity, IAggregateRoot
{
    public Guid? EmployeeId { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string? PhoneNumber { get; private set; }
    public string UserName { get; private set; } = string.Empty;
    public string NormalizedUserName { get; private set; } = string.Empty;
    public string NormalizedEmail { get; private set; } = string.Empty;
    public string Password { get; private set; } = string.Empty;
    public bool IsPlatformAdministrator { get; private set; }
    public bool AccountStatus { get; private set; } = true;
    public byte[]? ProfilePicture { get; private set; }
    public string? ProfilePictureContentType { get; private set; }
    public bool TwoFactorEnabled { get; private set; }
    public int FailedLoginAttempts { get; private set; }
    public DateTime? LockoutEndUtc { get; private set; }
    private readonly List<UserRole> _userRoles = new();
    public IReadOnlyCollection<UserRole> UserRoles => _userRoles.AsReadOnly();

    private User() : base() { }

    public static User Create(
        string fullName,
        string email,
        string? phoneNumber,
        string userName,
        string password,
        Guid? employeeId = null)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            throw new ArgumentException("Full name cannot be empty.", nameof(fullName));

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email cannot be empty.", nameof(email));

        if (string.IsNullOrWhiteSpace(userName))
            throw new ArgumentException("User name cannot be empty.", nameof(userName));

        if (string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("Password cannot be empty.", nameof(password));

        return new User
        {
            FullName = fullName,
            Email = email,
            PhoneNumber = phoneNumber?.Trim() ?? string.Empty,
            UserName = userName,
            NormalizedUserName = userName.Trim().ToUpperInvariant(),
            NormalizedEmail = email.Trim().ToUpperInvariant(),
            Password = password,
            EmployeeId = employeeId
            // TenantId, CreatedBy will be set by Repository.AddAsync()
        };
    }

    public void Update(
        string fullName,
        string email,
        string? phoneNumber,
        string userName,
        Guid? employeeId = null)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            throw new ArgumentException("Full name cannot be empty.", nameof(fullName));

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email cannot be empty.", nameof(email));

        if (string.IsNullOrWhiteSpace(userName))
            throw new ArgumentException("User name cannot be empty.", nameof(userName));

        FullName = fullName;
        Email = email;
        PhoneNumber = phoneNumber?.Trim() ?? string.Empty;
        UserName = userName;
        EmployeeId = employeeId;
        NormalizedUserName = userName.Trim().ToUpperInvariant();
        NormalizedEmail = email.Trim().ToUpperInvariant();
        base.Update();
    }

    public void UpdateProfile(
        string? fullName = null,
        string? email = null,
        string? phoneNumber = null)
    {
        if (fullName != null)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                throw new ArgumentException("Full name cannot be empty.", nameof(fullName));
            FullName = fullName;
        }

        if (email != null)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email cannot be empty.", nameof(email));
            Email = email;
            NormalizedEmail = email.Trim().ToUpperInvariant();
        }

        if (phoneNumber != null)
            PhoneNumber = phoneNumber.Trim();

        base.Update();
    }

    public void UpdateCredentials(string userName, string password)
    {
        if (string.IsNullOrWhiteSpace(userName))
            throw new ArgumentException("User name cannot be empty.", nameof(userName));

        if (string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("Password cannot be empty.", nameof(password));

        UserName = userName;
        NormalizedUserName = userName.Trim().ToUpperInvariant();
        Password = password;
        base.Update();
    }

    public void AssignRole(Guid roleId)
    {
        if (_userRoles.Any(r => r.RoleId == roleId))
            return;

        _userRoles.Add(UserRole.Create(roleId, Id));
    }

    public void RevokeRole(Guid roleId)
    {
        var role = _userRoles.FirstOrDefault(r => r.RoleId == roleId);
        if (role != null)
            _userRoles.Remove(role);
    }

    public void SetPlatformAdministrator(bool value)
    {
        IsPlatformAdministrator = value;
        base.Update();
    }

    public void ChangePassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("Password cannot be empty.", nameof(password));

        Password = password;
        base.Update();
    }

    public void SetProfilePicture(byte[] picture, string contentType)
    {
        if (picture.Length == 0) throw new ArgumentException("Profile picture cannot be empty.", nameof(picture));
        ProfilePicture = picture;
        ProfilePictureContentType = contentType;
        base.Update();
    }

    public void RemoveProfilePicture()
    {
        ProfilePicture = null;
        ProfilePictureContentType = null;
        base.Update();
    }

    public void UpdateSecurity(bool accountStatus, bool twoFactorEnabled, DateTime? lockoutEndUtc = null)
    {
        AccountStatus = accountStatus;
        TwoFactorEnabled = twoFactorEnabled;
        LockoutEndUtc = lockoutEndUtc;
        if (!lockoutEndUtc.HasValue) FailedLoginAttempts = 0;
        base.Update();
    }

    public void RecordFailedLogin(int lockoutThreshold = 5, int lockoutMinutes = 30)
    {
        FailedLoginAttempts++;
        if (FailedLoginAttempts >= lockoutThreshold)
        {
            LockoutEndUtc = DateTime.UtcNow.AddMinutes(lockoutMinutes);
        }
        base.Update();
    }

    public void RecordSuccessfulLogin()
    {
        FailedLoginAttempts = 0;
        LockoutEndUtc = null;
        base.Update();
    }
}

