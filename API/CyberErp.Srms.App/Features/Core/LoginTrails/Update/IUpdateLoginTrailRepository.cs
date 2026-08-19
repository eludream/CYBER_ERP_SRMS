using CyberErp.Srms.App.Features.Core.LoginTrails.DTOs;

namespace CyberErp.Srms.App.Features.Core.LoginTrails.Update
{
    public interface IUpdateLoginTrailRepository
    {
        Task<LoginTrailResult> UpdateAsync(UpdateLoginTrailDto dto);
    }
}
