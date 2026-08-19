using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.Dom.Entities.Core;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.DocumentSettings.Create;

public record DocumentSettingResult(Guid Id);

public class CreateDocumentSettingHandler(
    IRepository<DocumentSetting> repository,
    IUnitOfWork unitOfWork,
    IValidator<CreateDocumentSettingRequest> validator,
    ILogger<CreateDocumentSettingHandler> logger)
    : IFeatureHandler<CreateDocumentSettingRequest, DocumentSettingResult>
{
    public async Task<DocumentSettingResult> Handle(CreateDocumentSettingRequest request, CancellationToken ct = default)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new AppValidationException(validationResult.Errors);

        var documentSetting = DocumentSetting.Create(
            request.VoucherType,
            request.Prefix,
            request.Sufix,
            request.Year,
            request.LastNumber);

        await repository.AddAsync(documentSetting);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("DocumentSetting created with Id: {Id}", documentSetting.Id);

        return new DocumentSettingResult(documentSetting.Id);
    }
}