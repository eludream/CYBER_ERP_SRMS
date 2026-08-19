using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Features.Core.Approvers.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Approvers.GetById;

public class GetApproverByIdHandler(
    IRepository<Approver> repository,
    ILogger<GetApproverByIdHandler> logger)
    : IFeatureHandler<GetApproverByIdRequest, GetApproverDto?>
{
    public async Task<GetApproverDto?> Handle(GetApproverByIdRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Getting Approver with ID: {Id}", request.Id);

        var approver = await repository.GetAll()
            .Where(x => x.Id == request.Id)
            .Select(x => new GetApproverDto
            {
                Id = x.Id,
                VoucherType = x.VoucherType,
                ApproverId = x.ApproverId,
                StatusId = x.StatusId,
                Approver = x.ApproverUser.FullName,
                Status = x.Status.Name,
                Criteria = x.Criteria
            })
            .FirstOrDefaultAsync(ct);

        return approver;
    }
}