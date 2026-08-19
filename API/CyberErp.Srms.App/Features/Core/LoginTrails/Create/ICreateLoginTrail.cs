using CyberErp.Srms.App.Features.Core.LoginTrails.DTOs;

namespace CyberErp.Srms.App.Features.Core.LoginTrails.Create
{
    public interface ICreateLoginTrail
    {
        Task<LoginTrailResult> CreateAsync(LoginTrailDto dto);
    }
}

