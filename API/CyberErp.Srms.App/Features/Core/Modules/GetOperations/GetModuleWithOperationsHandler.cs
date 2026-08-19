using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.App.Features.Core.Modules.DTOs;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.Modules.GetOperations;

public class GetModuleWithOperationsHandler(
    IGetModuleWithOperationsRepository repository,
    ICurrentUserService currentUserService,
    ILogger<GetModuleWithOperationsHandler> logger)
    : IFeatureHandler<GetModuleWithOperationsRequest, IEnumerable<GetModuleWithOperationResult>>
{
    public async Task<IEnumerable<GetModuleWithOperationResult>> Handle(
        GetModuleWithOperationsRequest request,
        CancellationToken ct = default)
    {
        logger.LogInformation("Getting Modules with Operations");

        var userId = currentUserService.GetCurrentUserId();
        return await repository.GetAsync(userId, ct);
    }
}