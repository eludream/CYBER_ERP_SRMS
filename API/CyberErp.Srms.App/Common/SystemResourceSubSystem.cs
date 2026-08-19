using System.Globalization;
using System.Text;

namespace CyberErp.Srms.App.Common;

/// <summary>
/// Identifies the System Resource Management subsystem by stable code 001.
/// The row id and abbreviation may change; routing must use Abbreviation, never the id.
/// </summary>
public static class SystemResourceSubSystem
{
    public const string Code = "001";
    public const string LegacyCode = "001_srms";

    public static bool IsMatch(string? code)
    {
        var normalized = code?.Trim();
        return string.Equals(normalized, Code, StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, LegacyCode, StringComparison.OrdinalIgnoreCase);
    }

    public static string ToRouteSlug(string value)
    {
        var normalized = (value ?? string.Empty).Trim().ToLowerInvariant().Normalize(NormalizationForm.FormKD);
        var builder = new StringBuilder(normalized.Length);
        var pendingDash = false;
        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) == UnicodeCategory.NonSpacingMark)
                continue;
            if (character is >= 'a' and <= 'z' or >= '0' and <= '9')
            {
                builder.Append(character);
                pendingDash = false;
            }
            else if (builder.Length > 0 && !pendingDash)
            {
                builder.Append('-');
                pendingDash = true;
            }
        }
        return builder.ToString().Trim('-');
    }

    public static string RouteBasePath(string abbreviation)
    {
        var slug = ToRouteSlug(abbreviation);
        if (string.IsNullOrWhiteSpace(slug))
            throw new InvalidOperationException("The System Resource subsystem abbreviation is required for routing.");
        return "/" + slug;
    }
}
