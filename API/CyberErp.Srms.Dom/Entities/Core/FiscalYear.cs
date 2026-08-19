using NodaTime;

namespace CyberErp.Srms.Dom.Entities.Core;

public class FiscalYear : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public Instant StartDate { get; private set; }
    public Instant EndDate { get; private set; }
    public bool IsActive { get; private set; }

    // Private constructor for EF Core
    private FiscalYear() : base() { }

    // Factory method for creation
    public static FiscalYear Create(
        string name,
        Instant startDate,
        Instant endDate,
        bool isActive = false)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Fiscal year name cannot be empty.", nameof(name));

        if (endDate < startDate)
            throw new ArgumentException("End date cannot be before start date.", nameof(endDate));

        return new FiscalYear
        {
            Name = name,
            StartDate = startDate,
            EndDate = endDate,
            IsActive = isActive
            // TenantId, CreatedBy will be set by Repository.AddAsync()
        };
    }

    // Update methods
    public void Update(
        string name,
        Instant startDate,
        Instant endDate,
        bool? isActive = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Fiscal year name cannot be empty.", nameof(name));

        if (endDate < startDate)
            throw new ArgumentException("End date cannot be before start date.", nameof(endDate));

        Name = name;
        StartDate = startDate;
        EndDate = endDate;
        if (isActive.HasValue) IsActive = isActive.Value;
        base.Update();
    }

    public void UpdateDates(Instant startDate, Instant endDate)
    {
        if (endDate < startDate)
            throw new ArgumentException("End date cannot be before start date.", nameof(endDate));

        StartDate = startDate;
        EndDate = endDate;
        base.Update();
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        base.Update();
    }
}

