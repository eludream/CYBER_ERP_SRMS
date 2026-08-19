using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.DocumentSettings.Update;

public record DocumentSettingResult(Guid Id);

public class UpdateDocumentSettingHandler(
    IRepository<DocumentSetting> repository,
    IUnitOfWork unitOfWork,
    IValidator<UpdateDocumentSettingRequest> validator,
    ILogger<UpdateDocumentSettingHandler> logger)
    : IFeatureHandler<UpdateDocumentSettingRequest, DocumentSettingResult>
{
    public async Task<DocumentSettingResult> Handle(UpdateDocumentSettingRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var documentSetting = await repository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (documentSetting == null)
        {
            logger.LogWarning("DocumentSetting with Id: {Id} not found", request.Id);
            throw new NotFoundException(nameof(DocumentSetting), request.Id.ToString());
        }

        documentSetting.Update(
            request.VoucherType,
            request.Prefix,
            request.Sufix,
            request.Year,
            request.LastNumber);

        repository.UpdateAsync(documentSetting);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("DocumentSetting updated with Id: {Id}", documentSetting.Id);

        return new DocumentSettingResult(documentSetting.Id);
    }
}