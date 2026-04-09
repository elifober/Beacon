namespace Beacon.API.Models;

/// <summary>
/// Share of total <see cref="DonationAllocation.AmountAllocated"/> for one program area (landing impact strip).
/// </summary>
public class ProgramAreaAllocationShareDto
{
    public string ProgramArea { get; set; } = "";

    /// <summary>Percent of all allocated amounts (0–100).</summary>
    public decimal PercentOfTotal { get; set; }

    public decimal AmountAllocated { get; set; }
}
