using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CyberErp.Srms.Api.Controllers;
using CyberErp.Srms.App.Features.Core.Users.Create;
using CyberErp.Srms.App.Features.Core.Users.Update;
using CyberErp.Srms.App.Features.Core.Users.Delete;
using CyberErp.Srms.App.Features.Core.Users.GetAll;
using CyberErp.Srms.App.Features.Core.Users.GetById;
using CyberErp.Srms.App.Features.Core.Users.DTOs;
using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.Inf.Models;
using Microsoft.EntityFrameworkCore;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.Dom.Entities.Core;
using System.Data;

namespace CyberErp.Srms.Api.Controllers.Core
{
    public class UserController : BaseController
    {
        private readonly IFeatureHandler<CreateUserRequest, CyberErp.Srms.App.Features.Core.Users.Create.UserResult> _createUser;
        private readonly IFeatureHandler<UpdateUserRequest, CyberErp.Srms.App.Features.Core.Users.Update.UserResult> _updateUser;
        private readonly IFeatureHandler<DeleteUserRequest, CyberErp.Srms.App.Features.Core.Users.Delete.UserResult> _deleteUser;
        private readonly IFeatureHandler<GetAllUsersRequest, PaginatedResponse<UserDto>> _getAllUsers;
        private readonly IFeatureHandler<GetUserByIdRequest, UserDto> _getUserById;
        private readonly SrmsDbContext _db;
        private readonly IAuthentication _authentication;
        private readonly IWebHostEnvironment _environment;

        public UserController(
            IFeatureHandler<CreateUserRequest, CyberErp.Srms.App.Features.Core.Users.Create.UserResult> createUser,
            IFeatureHandler<UpdateUserRequest, CyberErp.Srms.App.Features.Core.Users.Update.UserResult> updateUser,
            IFeatureHandler<DeleteUserRequest, CyberErp.Srms.App.Features.Core.Users.Delete.UserResult> deleteUser,
            IFeatureHandler<GetAllUsersRequest, PaginatedResponse<UserDto>> getAllUsers,
            IFeatureHandler<GetUserByIdRequest, UserDto> getUserById,
            SrmsDbContext db,
            IAuthentication authentication,
            IWebHostEnvironment environment)
        {
            _createUser = createUser;
            _updateUser = updateUser;
            _deleteUser = deleteUser;
            _getAllUsers = getAllUsers;
            _getUserById = getUserById;
            _db = db;
            _authentication = authentication;
            _environment = environment;
        }

        [HttpGet]
        public async Task<PaginatedResponse<UserDto>> GetAll([FromQuery] GetAllUsersRequest request)
        {
            return await _getAllUsers.Handle(request);
        }

        [HttpGet("password-policy")]
        public async Task<IActionResult> GetPasswordPolicy(CancellationToken ct)
        {
            var settings = await _db.PlatformSystemSettings.AsNoTracking().SingleAsync(ct);
            return Ok(new PasswordPolicyResponse(
                settings.MinimumPasswordLength,
                settings.RequireUppercase,
                settings.RequireNumbers,
                settings.RequireSpecialCharacters,
                RequireLowercase: true));
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<UserDto>> GetById(Guid id)
        {
            // Without a tenant, only the signed-in user may read their own profile.
            if (!HasTenantContext() && !IsCurrentUser(id)) return Forbid();
            return await _getUserById.Handle(new GetUserByIdRequest(id));
        }

        [HttpPost]
        public async Task<ActionResult<CyberErp.Srms.App.Features.Core.Users.Create.UserResult>> Create(
            [FromBody] CreateUserRequest dto,
            CancellationToken ct)
        {
            var settings = await _db.PlatformSystemSettings.AsNoTracking().SingleAsync(ct);
            var passwordErrors = PlatformSecurityPolicy.ValidatePassword(dto.Password, settings);
            if (passwordErrors.Count > 0)
                return BadRequest(new { message = string.Join(" ", passwordErrors), errors = passwordErrors });

            var roleIds = dto.RoleIds?.Distinct().ToArray() ?? [];
            var validRoleIds = await _db.StandardRoleTemplates.AsNoTracking()
                .Where(role => role.IsPlatformRole && role.IsActive && roleIds.Contains(role.Id))
                .Select(role => role.Id)
                .ToArrayAsync(ct);
            if (validRoleIds.Length != roleIds.Length)
                return BadRequest("One or more roles are inactive or are not platform roles.");

            var result = await _createUser.Handle(dto, ct);
            foreach (var roleId in validRoleIds)
            {
                var userRole = UserRole.Create(roleId, result.Id);
                _db.UserRole.Add(userRole);
            }
            if (validRoleIds.Length > 0)
                await _db.SaveChangesAsync(ct);

            return Ok(result);
        }

        [HttpGet("available-employees")]
        public async Task<ActionResult<IReadOnlyList<AvailableEmployeeDto>>> GetAvailableEmployees(
            [FromQuery] Guid? currentUserId,
            CancellationToken ct)
        {
            var results = new List<AvailableEmployeeDto>();
            var connection = _db.Database.GetDbConnection();
            var shouldClose = connection.State != ConnectionState.Open;
            if (shouldClose) await connection.OpenAsync(ct);

            try
            {
                await using var command = connection.CreateCommand();
                command.CommandText = """
                    SELECT e.Id AS EmployeeId,
                           e.EmployeeNumber,
                           LTRIM(RTRIM(CONCAT(p.FirstName, ' ', NULLIF(p.FatherName, ''), ' ', p.GrandFatherName))) AS FullName,
                           e.Email,
                           p.PhoneNumber
                    FROM [Hrms].[Employee] e
                    INNER JOIN [Core].[Person] p ON p.Id = e.PersonId
                    WHERE p.IsDeleted = 0
                      AND NOT EXISTS (
                          SELECT 1 FROM [Core].[User] u
                          WHERE u.EmployeeId = e.Id AND (@currentUserId IS NULL OR u.Id <> @currentUserId)
                      )
                    ORDER BY p.FirstName, p.FatherName, p.GrandFatherName, e.EmployeeNumber;
                    """;
                var userParameter = command.CreateParameter();
                userParameter.ParameterName = "@currentUserId";
                userParameter.Value = currentUserId.HasValue ? currentUserId.Value : DBNull.Value;
                command.Parameters.Add(userParameter);

                await using var reader = await command.ExecuteReaderAsync(ct);
                while (await reader.ReadAsync(ct))
                {
                    results.Add(new AvailableEmployeeDto(
                        reader.GetGuid(0), reader.GetString(1), reader.GetString(2),
                        reader.IsDBNull(3) ? null : reader.GetString(3),
                        reader.IsDBNull(4) ? null : reader.GetString(4)));
                }
            }
            finally
            {
                if (shouldClose) await connection.CloseAsync();
            }

            return Ok(results);
        }

        [HttpPut]
        public async Task<ActionResult<CyberErp.Srms.App.Features.Core.Users.Update.UserResult>> Update([FromBody] UpdateUserRequest dto)
        {
            // Without a tenant, only the signed-in user may update their own profile.
            if (!HasTenantContext() && !IsCurrentUser(dto.Id)) return Forbid();
            return await _updateUser.Handle(dto);
        }

        [HttpDelete("{id}")]
        public async Task<CyberErp.Srms.App.Features.Core.Users.Delete.UserResult> Delete(Guid id)
        {
            return await _deleteUser.Handle(new DeleteUserRequest(id));
        }

        [HttpPost("{id:guid}/profile-picture")]
        [RequestSizeLimit(5 * 1024 * 1024)]
        public async Task<IActionResult> UploadProfilePicture(Guid id, IFormFile file, CancellationToken ct)
        {
            if (file is null || file.Length == 0) return BadRequest("An image file is required.");
            if (file.Length > 5 * 1024 * 1024) return BadRequest("Profile pictures must be 5 MB or smaller.");
            var allowedTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!allowedTypes.Contains(file.ContentType)) return BadRequest("Only JPG, PNG, GIF, and WebP images are supported.");

            if (!IsCurrentUser(id) && !await CanManageUserProfileAsync(id, ct)) return Forbid();
            var user = await _db.User.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (user is null) return NotFound();
            await using var stream = new MemoryStream();
            await file.CopyToAsync(stream, ct);
            user.SetProfilePicture(stream.ToArray(), file.ContentType);
            await _db.SaveChangesAsync(ct);
            return Ok(new { profilePictureUrl = $"/api/v1.0/User/{id}/profile-picture?v={DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}" });
        }

        [HttpGet("{id:guid}/profile-picture")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProfilePicture(Guid id, CancellationToken ct)
        {
            var picture = await _db.User.AsNoTracking()
                .Where(x => x.Id == id)
                .Select(x => new { x.ProfilePicture, x.ProfilePictureContentType })
                .FirstOrDefaultAsync(ct);
            if (picture?.ProfilePicture is null)
            {
                Response.Headers.CacheControl = "no-store";
                return NotFound();
            }
            return File(picture.ProfilePicture, picture.ProfilePictureContentType ?? "image/jpeg");
        }

        [HttpDelete("{id:guid}/profile-picture")]
        public async Task<IActionResult> RemoveProfilePicture(Guid id, CancellationToken ct)
        {
            if (!IsCurrentUser(id) && !await CanManageUserProfileAsync(id, ct)) return Forbid();
            var user = await _db.User.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (user is null) return NotFound();
            user.RemoveProfilePicture();
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        [HttpGet("{id:guid}/account-profile")]
        public async Task<IActionResult> GetAccountProfile(Guid id, CancellationToken ct)
        {
            if (!IsCurrentUser(id)) return Forbid();
            var tenantId = CurrentTenantId();
            var user = await _db.User.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
            if (user is null) return NotFound();

            var activityQuery = _db.LoginTrail.AsNoTracking().Where(x => x.UserId == id);
            if (!string.IsNullOrWhiteSpace(tenantId) && tenantId != Guid.Empty.ToString())
                activityQuery = activityQuery.Where(x => x.TenantId == tenantId);
            var activity = await activityQuery
                .OrderByDescending(x => x.Date).Take(10)
                .Select(x => new { timestamp = x.Date, x.IpAddress, x.UserAgent, x.Status, x.FailureReason, x.EventType })
                .ToListAsync(ct);
            var lastLoginUtc = activity.FirstOrDefault(x => x.Status == "Success")?.timestamp;

            return Ok(new {
                user.AccountStatus, user.TwoFactorEnabled, user.FailedLoginAttempts, user.LockoutEndUtc,
                createdAt = user.CreatedAt.ToDateTimeUtc(), updatedAt = user.UpdatedAt.HasValue ? user.UpdatedAt.Value.ToDateTimeUtc() : (DateTime?)null,
                user.CreatedBy, user.UpdatedBy, lastLoginUtc, activity
            });
        }

        [HttpPost("{id:guid}/change-password")]
        public async Task<IActionResult> ChangePassword(Guid id, [FromBody] ChangePasswordRequest request, CancellationToken ct)
        {
            if (!IsCurrentUser(id)) return Forbid();
            if (string.IsNullOrWhiteSpace(request.CurrentPassword))
                return BadRequest(new { message = "The current password is required." });

            var settings = await _db.PlatformSystemSettings.AsNoTracking().SingleAsync(ct);
            var passwordErrors = PlatformSecurityPolicy.ValidatePassword(request.NewPassword, settings);
            if (passwordErrors.Count > 0)
                return BadRequest(new { message = string.Join(" ", passwordErrors), errors = passwordErrors });

            var user = await _db.User.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (user is null) return NotFound();
            if (!_authentication.VerifyPassword(request.CurrentPassword, user.Password))
                return BadRequest(new { message = "The current password is incorrect." });
            if (_authentication.VerifyPassword(request.NewPassword, user.Password))
                return BadRequest(new { message = "The new password must be different from the current password." });

            user.ChangePassword(_authentication.EncryptPassword(request.NewPassword));
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        [HttpGet("{id:guid}/preferences")]
        public async Task<IActionResult> GetPreferences(Guid id, CancellationToken ct)
        {
            if (!IsCurrentUser(id)) return Forbid();
            var preference = await _db.UserPreference.AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == id, ct);
            return Ok(preference is null
                ? new UserPreferenceResponse("en", "Africa/Nairobi", "dd/MM/yyyy", "1,234.56", "/", "system", true, true, true)
                : new UserPreferenceResponse(preference.Language, preference.TimeZone, preference.DateFormat,
                    preference.NumberFormat, preference.LandingPage, preference.Theme, preference.EmailNotifications,
                    preference.InAppNotifications, preference.ApprovalNotifications));
        }

        [HttpPut("{id:guid}/preferences")]
        public async Task<IActionResult> UpdatePreferences(Guid id, [FromBody] UserPreferenceRequest request, CancellationToken ct)
        {
            if (!IsCurrentUser(id)) return Forbid();
            var tenantId = HasTenantContext() ? CurrentTenantId() : Guid.Empty.ToString();
            var preference = await _db.UserPreference.FirstOrDefaultAsync(x => x.UserId == id, ct);
            if (preference is null)
            {
                preference = UserPreference.Create(id, tenantId);
                _db.UserPreference.Add(preference);
            }
            preference.UpdatePreferences(request.Language, request.TimeZone, request.DateFormat, request.NumberFormat,
                request.LandingPage, request.Theme, request.EmailNotifications, request.InAppNotifications, request.ApprovalNotifications);
            await _db.SaveChangesAsync(ct);
            return Ok(new UserPreferenceResponse(preference.Language, preference.TimeZone, preference.DateFormat,
                preference.NumberFormat, preference.LandingPage, preference.Theme, preference.EmailNotifications,
                preference.InAppNotifications, preference.ApprovalNotifications));
        }

        private bool IsCurrentUser(Guid id) =>
            Guid.TryParse(User.FindFirst("UserId")?.Value, out var currentUserId) && currentUserId == id;

        private string CurrentTenantId() =>
            User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenant_id")?.Value ?? string.Empty;

        private bool HasTenantContext() =>
            Guid.TryParse(CurrentTenantId(), out var tenantId) && tenantId != Guid.Empty;

        private Guid CurrentTenantGuid() =>
            Guid.TryParse(CurrentTenantId(), out var tenantId) && tenantId != Guid.Empty
                ? tenantId
                : throw new UnauthorizedAccessException("Select a tenant first.");

        private Task<bool> IsActiveTenantUser(Guid userId, CancellationToken ct)
        {
            if (_environment.IsDevelopment()) return Task.FromResult(true);
            if (!HasTenantContext()) return Task.FromResult(false);
            var tenantId = CurrentTenantGuid();
            return _db.TenantUsers.AsNoTracking().AnyAsync(
                x => x.UserId == userId && x.TenantId == tenantId && x.Status == MembershipStatus.Active, ct);
        }

        private async Task<bool> CanManageUserProfileAsync(Guid userId, CancellationToken ct) =>
            _environment.IsDevelopment() || await IsActiveTenantUser(userId, ct);
    }

    public record PasswordPolicyResponse(
        int MinimumPasswordLength,
        bool RequireUppercase,
        bool RequireNumbers,
        bool RequireSpecialCharacters,
        bool RequireLowercase);
    public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
    public record UserPreferenceRequest(string Language, string TimeZone, string DateFormat, string NumberFormat,
        string LandingPage, string Theme, bool EmailNotifications, bool InAppNotifications, bool ApprovalNotifications);
    public record UserPreferenceResponse(string Language, string TimeZone, string DateFormat, string NumberFormat,
        string LandingPage, string Theme, bool EmailNotifications, bool InAppNotifications, bool ApprovalNotifications);
    public record AvailableEmployeeDto(Guid EmployeeId, string EmployeeNumber, string FullName, string? Email, string? PhoneNumber);
}
