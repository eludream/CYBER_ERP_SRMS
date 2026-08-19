namespace CyberErp.Srms.Api.Configuration
{
    public class JwtConfiguration
    {
        public string Subject { get; set; } = "CyberErpSrmsApi";
        public string Key { get; set; } = "YourSuperSecretKeyForJwtTokenGeneration12345";
        public string Issuer { get; set; } = "CyberErpSrmsApi";
        public string Audience { get; set; } = "CyberErpSrmsApiUsers";
        public int ExpirationInHours { get; set; } = 1;
    }
}
