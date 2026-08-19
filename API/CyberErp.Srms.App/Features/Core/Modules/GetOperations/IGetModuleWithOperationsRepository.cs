using CyberErp.Srms.App.Features.Core.Modules.DTOs;

namespace CyberErp.Srms.App.Features.Core.Modules.GetOperations;

public interface IGetModuleWithOperationsRepository
{
    Task<IEnumerable<GetModuleWithOperationResult>> GetAsync(Guid? userId, CancellationToken ct = default);
}