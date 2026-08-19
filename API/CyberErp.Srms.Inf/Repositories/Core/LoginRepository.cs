using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.App.Features.Core.Users.DTOs;
using CyberErp.Srms.App.Features.Core.Users.Login;
using CyberErp.Srms.Dom.Entities.Core;
using CyberErp.Srms.Inf.Common;
using CyberErp.Srms.Inf.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.Inf.Repositories.Core;

public class LoginRepository(
    IRepository<User> userRepository,
    IAuthentication authentication,
    ITokenStore tokenStore,
    ITokenParser tokenParser,
    IHttpContextAccessor httpContextAccessor,
    ILogger<LoginRepository> logger,
    IExceptionHandler exceptionHandler,
    IUnitOfWork unitOfWork,
    SrmsDbContext db) : ILoginRepository
{
    private readonly IRepository<User> _userRepository = userRepository;
    private readonly IAuthentication _authentication = authentication;
    private readonly ILogger<LoginRepository> _logger = logger;
    private readonly ITokenStore _tokenStore = tokenStore;
    private readonly ITokenParser _tokenParser = tokenParser;
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;
    private readonly IExceptionHandler _exceptionHandler = exceptionHandler;
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly SrmsDbContext _db = db;

    public async Task<UserResult> Loginsync(LoginUserDto dto)
    {
        _logger.LogInformation("Login with UserName: {UserName}", dto.UserName);

        var normalized = dto.UserName.Trim().ToUpperInvariant();
        var snapshot = await _db.User.AsNoTracking()
            .Where(mu => mu.NormalizedUserName == normalized)
            .Select(mu => new
            {
                mu.Id,
                mu.EmployeeId,
                mu.FullName,
                mu.Email,
                mu.PhoneNumber,
                mu.UserName,
                mu.Password,
                mu.AccountStatus,
                mu.FailedLoginAttempts,
                mu.LockoutEndUtc,
                mu.IsPlatformAdministrator,
                HasProfilePicture = mu.ProfilePicture != null
            })
            .SingleOrDefaultAsync();

        if (snapshot is null)
        {
            _logger.LogWarning("Invalid credentials for UserName: {UserName}", dto.UserName);
            throw new UnauthorizedException("Invalid username or password");
        }

        var policy = await _db.PlatformSystemSettings
            .AsNoTracking()
            .Select(settings => new
            {
                settings.MaxLoginAttempts,
                settings.LockoutDurationMinutes
            })
            .SingleOrDefaultAsync();
        var maxLoginAttempts = policy is { MaxLoginAttempts: > 0 } ? policy.MaxLoginAttempts : 5;
        var lockoutDurationMinutes = policy is { LockoutDurationMinutes: >= 0 }
            ? policy.LockoutDurationMinutes
            : 30;

        if (!snapshot.AccountStatus)
        {
            _logger.LogWarning("Login blocked for inactive account: {UserName}", dto.UserName);
            throw new UnauthorizedException("Your account is inactive. Contact your administrator to reactivate it.");
        }

        async Task<User> LoadUser() =>
            await _userRepository.GetAllWithoutTenantFilter().SingleAsync(mu => mu.Id == snapshot.Id);

        if (snapshot.LockoutEndUtc.HasValue)
        {
            if (snapshot.LockoutEndUtc.Value > DateTime.UtcNow)
            {
                _logger.LogWarning("Login blocked for locked account: {UserName}", dto.UserName);
                throw new UnauthorizedException("Your account is temporarily locked. Try again after the lockout period.");
            }

            var unlockedUser = await LoadUser();
            unlockedUser.RecordSuccessfulLogin();
            await _unitOfWork.SaveChangesAsync();
        }

        if (!_authentication.VerifyPassword(dto.Password, snapshot.Password))
        {
            var failedUser = await LoadUser();
            failedUser.RecordFailedLogin(maxLoginAttempts, lockoutDurationMinutes);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogWarning(
                "Invalid credentials for UserName: {UserName}. Failed attempt {FailedAttempt} of {MaxAttempts}",
                dto.UserName,
                failedUser.FailedLoginAttempts,
                maxLoginAttempts);

            if (failedUser.LockoutEndUtc.HasValue && failedUser.LockoutEndUtc.Value > DateTime.UtcNow)
                throw new UnauthorizedException($"Your account is temporarily locked for {lockoutDurationMinutes} minutes.");

            throw new UnauthorizedException("Invalid username or password");
        }

        if (snapshot.FailedLoginAttempts > 0 || snapshot.LockoutEndUtc.HasValue)
        {
            var successfulUser = await LoadUser();
            successfulUser.RecordSuccessfulLogin();
            await _unitOfWork.SaveChangesAsync();
        }

        var tokenId = Guid.NewGuid();
        var userResult = new UserResult
        {
            Id = snapshot.Id,
            EmployeeId = snapshot.EmployeeId,
            FullName = snapshot.FullName,
            Email = snapshot.Email,
            PhoneNumber = snapshot.PhoneNumber ?? string.Empty,
            UserName = snapshot.UserName,
            ProfilePictureUrl = snapshot.HasProfilePicture ? $"/api/v1.0/User/{snapshot.Id}/profile-picture" : null,
            TenantId = null,
            IsPlatformAdministrator = snapshot.IsPlatformAdministrator
        };

        var token = _authentication.GenerateToken(userResult, tokenId);
        var jwtToken = _tokenParser.ParseToken(token);
        userResult.Token = token;

        await _tokenStore.StoreAsync(tokenId.ToString(), jwtToken.ValidTo);

        SetUserCookies(snapshot.Id.ToString(), snapshot.UserName);

        return userResult;
    }

    private void SetUserCookies(string userId, string userName)
    {
        var context = _httpContextAccessor.HttpContext;
        if (context == null || string.IsNullOrEmpty(userId))
            return;

        context.Response.Cookies.Append("UserId", userId, new CookieOptions
        {
            HttpOnly = true,
            IsEssential = true,
            SameSite = SameSiteMode.Lax,
            Secure = context.Request.IsHttps,
            Expires = DateTimeOffset.UtcNow.AddDays(14)
        });

        if (!string.IsNullOrEmpty(userName))
        {
            context.Response.Cookies.Append("UserName", userName, new CookieOptions
            {
                HttpOnly = true,
                IsEssential = true,
                SameSite = SameSiteMode.Lax,
                Secure = context.Request.IsHttps,
                Expires = DateTimeOffset.UtcNow.AddDays(14)
            });
        }
    }
}
