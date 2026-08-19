using CyberErp.Srms.App.Common.Handlers;
using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.App.Common.Exceptions;
using CyberErp.Srms.App.Features.Core.DocumentSettings.DTOs;
using CyberErp.Srms.Dom.Entities.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CyberErp.Srms.App.Features.Core.DocumentSettings.GetById;

public class GetDocumentSettingByIdHandler(
    IRepository<DocumentSetting> repository,
    ILogger<GetDocumentSettingByIdHandler> logger)
    : IFeatureHandler<GetDocumentSettingByIdRequest, DocumentSettingDto>
{
    public async Task<DocumentSettingDto> Handle(GetDocumentSettingByIdRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Getting DocumentSetting with ID: {Id}", request.Id);

        var documentSetting = await repository.GetAll()
            .FirstOrDefaultAsync(ds => ds.Id == request.Id, ct);

        if (documentSetting == null)
        {
            logger.LogWarning("DocumentSetting with ID {Id} not found", request.Id);
            throw new NotFoundException(nameof(DocumentSetting), request.Id.ToString());
        }

        return new DocumentSettingDto
        {
            Id = documentSetting.Id,
            VoucherType = documentSetting.VoucherType,
            Prefix = documentSetting.Prefix,
            Sufix = documentSetting.Sufix,
            Year = documentSetting.Year,
            LastNumber = documentSetting.LastNumber
        };
    }
}