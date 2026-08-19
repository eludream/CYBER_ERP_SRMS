using CyberErp.Srms.App.Features.Core.LoginTrails.DTOs;

namespace CyberErp.Srms.App.Features.Core.LoginTrails.Delete
{
    public interface IDeleteLoginTrail
    {
        Task<LoginTrailResult> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    }
}

