namespace CyberErp.Srms.Dom.Entities.Core;

public static class PlatformSecurityPolicy
{
    public static IReadOnlyList<string> ValidatePassword(string? password, PlatformSystemSettings settings)
    {
        var errors = new List<string>();
        if (string.IsNullOrEmpty(password))
            return ["Password is required."];

        if (password.Length < settings.MinimumPasswordLength)
            errors.Add($"Password must be at least {settings.MinimumPasswordLength} characters.");
        if (!password.Any(char.IsLower))
            errors.Add("Password must contain a lowercase letter.");
        if (settings.RequireUppercase && !password.Any(char.IsUpper))
            errors.Add("Password must contain an uppercase letter.");
        if (settings.RequireNumbers && !password.Any(char.IsDigit))
            errors.Add("Password must contain a number.");
        if (settings.RequireSpecialCharacters && !password.Any(character => !char.IsLetterOrDigit(character)))
            errors.Add("Password must contain a special character.");

        return errors;
    }
}
