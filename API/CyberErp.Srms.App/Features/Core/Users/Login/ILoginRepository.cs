
using CyberErp.Srms.App.Features.Core.Users.DTOs;

namespace CyberErp.Srms.App.Features.Core.Users.Login
{
    public interface ILoginRepository
    {
        Task<UserResult> Loginsync(LoginUserDto dto);
    }
}

