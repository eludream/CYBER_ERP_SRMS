using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.Inf.Models;
using Microsoft.EntityFrameworkCore;

namespace CyberErp.Srms.Inf.Common.Services;

internal class Status(SrmsDbContext context) : IStatus
{
    private readonly SrmsDbContext _context = context;

    public async Task<Guid> GetStatusIdAsync(string name)
    {
        var status = await _context.VoucherStatus
            .FirstOrDefaultAsync(s => s.Name == name);

        return status?.Id
            ?? throw new Exception($"Voucher status not found: {name}");
    }
}
