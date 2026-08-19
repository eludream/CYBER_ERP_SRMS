namespace CyberErp.Srms.Dom.Entities.Core;

public class ModuleDataSet : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string PayloadJson { get; private set; } = "[]";

    private ModuleDataSet() { }

    public static ModuleDataSet Create(string name, string payloadJson, string tenantId)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Dataset name is required.", nameof(name));
        return new ModuleDataSet { Name = name, PayloadJson = payloadJson, TenantId = tenantId };
    }

    public void UpdatePayload(string payloadJson)
    {
        PayloadJson = payloadJson;
        Update();
    }
}
