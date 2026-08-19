using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.Operations.Delete;
using CyberErp.Srms.Dom.Entities.Core;
using CyberErp.Srms.Inf.Models;
using Microsoft.EntityFrameworkCore;

namespace CyberErp.Srms.Inf.Repositories.Core.Operations;

public sealed class DeleteOperationRepository(SrmsDbContext db) : IDeleteOperationRepository
{
    public async Task<Operation?> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var operation = await db.Operation.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (operation == null)
        {
            return null;
        }

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        // Tenant permissions are assignments owned by the operation and must be
        // removed first because the relationship intentionally restricts cascades.
        await db.TenantRolePermissions
            .Where(x => x.TenantOperation.Id == id)
            .ExecuteDeleteAsync(ct);
        await db.Operation
            .Where(x => x.Id == id)
            .ExecuteDeleteAsync(ct);

        await transaction.CommitAsync(ct);
        return operation;
    }
}
