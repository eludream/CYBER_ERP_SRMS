using CyberErp.Srms.App.Features.Core.LoginTrails.DTOs;

namespace CyberErp.Srms.App.Features.Core.LoginTrails.GetById
{
    public interface IGetLoginTrailByIdRepository
    {
        Task<LoginTrailDto> GetByIdAsync(Guid id);
    }
}

