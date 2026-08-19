using CyberErp.Srms.Dom.Entities.Core;

namespace CyberErp.Srms.App.Features.Core.Operations.Delete;

public interface IDeleteOperationRepository
{
    Task<Operation?> DeleteAsync(Guid id, CancellationToken ct = default);
}
