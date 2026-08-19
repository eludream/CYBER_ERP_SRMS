using CyberErp.Srms.App.Features.Core.Users.DTOs;

namespace CyberErp.Srms.App.Features.Core.Users.Register
{
    public interface IRegisterRepository
    {
        Task<RegisterResult> RegisterAsync(RegisterUserDto dto);
        Task<RegisterResult> RegisterWithGoogleAsync(RegisterWithGoogleDto dto);
    }
}
