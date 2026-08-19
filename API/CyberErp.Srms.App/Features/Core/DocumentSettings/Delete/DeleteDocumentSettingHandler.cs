using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.DocumentSettings.Delete;

public record DocumentSettingResult(Guid Id);

public class DeleteDocumentSettingHandler(
    IRepository<DocumentSetting> repository,
    IUnitOfWork unitOfWork,
    ILogger<DeleteDocumentSettingHandler> logger)
    : IFeatureHandler<DeleteDocumentSettingRequest, DocumentSettingResult>
{
    public async Task<DocumentSettingResult> Handle(DeleteDocumentSettingRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Deleting DocumentSetting with Id: {Id}", request.Id);

        var documentSetting = await repository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (documentSetting == null)
        {
            logger.LogWarning("DocumentSetting with Id: {Id} not found", request.Id);
            throw new NotFoundException(nameof(DocumentSetting), request.Id.ToString());
        }

        repository.Delete(documentSetting);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("DocumentSetting deleted successfully with Id: {Id}", documentSetting.Id);

        return new DocumentSettingResult(documentSetting.Id);
    }
}