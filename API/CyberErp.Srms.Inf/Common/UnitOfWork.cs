using CyberErp.Srms.App.Common.Repositories;
using CyberErp.Srms.Inf.Models;
using Microsoft.EntityFrameworkCore;

namespace CyberErp.Srms.Inf.Common;

public class UnitOfWork(SrmsDbContext db) : IUnitOfWork
{
    private readonly SrmsDbContext _db = db;

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}