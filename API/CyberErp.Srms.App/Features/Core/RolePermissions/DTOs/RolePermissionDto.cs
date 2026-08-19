namespace CyberErp.Srms.App.Features.Core.RolePermissions.DTOs;

public class RolePermissionDto
{
    public Guid Id { get; set; }
    public Guid RoleId { get; set; }
    public Guid OperationId { get; set; }
    public bool CanAdd { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
    public bool CanApprove { get; set; }
    public bool CanView { get; set; }
}