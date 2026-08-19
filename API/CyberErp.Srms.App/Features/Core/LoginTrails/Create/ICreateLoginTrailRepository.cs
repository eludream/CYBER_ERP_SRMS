using CyberErp.Srms.App.Features.Core.LoginTrails.DTOs;

namespace CyberErp.Srms.App.Features.Core.LoginTrails.Create
{
    public interface ICreateLoginTrailRepository
    {
        Task<LoginTrailResult> CreateAsync(LoginTrailDto dto);
    }
}
