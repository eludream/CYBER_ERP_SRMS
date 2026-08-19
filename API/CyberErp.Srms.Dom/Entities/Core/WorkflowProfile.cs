namespace CyberErp.Srms.Dom.Entities.Core;

public class WorkflowProfile : BaseEntity, IAggregateRoot
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string Module { get; private set; } = string.Empty;
    public string DocumentType { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;
    public int Version { get; private set; } = 1;
    public string DefinitionJson { get; private set; } = "{}";

    private WorkflowProfile() { }

    public static WorkflowProfile Create(string name, string? description, string module, string documentType, string definitionJson)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Name is required.", nameof(name));
        if (string.IsNullOrWhiteSpace(module)) throw new ArgumentException("Module is required.", nameof(module));
        if (string.IsNullOrWhiteSpace(documentType)) throw new ArgumentException("Document type is required.", nameof(documentType));
        return new WorkflowProfile { Name = name, Description = description, Module = module, DocumentType = documentType, DefinitionJson = definitionJson };
    }

    public void UpdateProfile(string name, string? description, string module, string documentType, bool isActive, string definitionJson)
    {
        Name = name;
        Description = description;
        Module = module;
        DocumentType = documentType;
        IsActive = isActive;
        DefinitionJson = definitionJson;
        Version++;
        base.Update();
    }
}
