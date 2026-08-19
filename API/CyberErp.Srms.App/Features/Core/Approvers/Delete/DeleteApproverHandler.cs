using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Approvers.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Approvers.Delete;

public class DeleteApproverHandler(
    IRepository<Approver> repository,
    IUnitOfWork unitOfWork,
    ILogger<DeleteApproverHandler> logger)
    : IFeatureHandler<DeleteApproverRequest, ApproverResult?>
{
    public async Task<ApproverResult?> Handle(DeleteApproverRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Deleting Approver with Id: {Id}", request.Id);

        var approver = await repository.GetAll()
            .Where(x => x.Id == request.Id)
            .FirstOrDefaultAsync();
        if (approver == null)
        {
            logger.LogWarning("Approver with ID: {Id} not found", request.Id);
            return null;
        }

        repository.Delete(approver);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Approver deleted successfully with ID: {Id}", approver.Id);

        return new ApproverResult { Id = approver.Id };
    }
}