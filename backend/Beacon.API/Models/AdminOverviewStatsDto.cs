namespace Beacon.API.Models;

/// <summary>
/// Admin dashboard: safe aggregate counts (no PII, no per-resident detail).
/// </summary>
public class AdminOverviewStatsDto
{
    public int TotalResidentsServed { get; set; }
    public int CurrentResidents { get; set; }
    public int ActiveSafehouses { get; set; }
    public int TotalPartners { get; set; }
    public int TotalSupporters { get; set; }

    public int DonationsLast30Days { get; set; }
    public int IncidentsLast7Days { get; set; }
    public int UnresolvedIncidents { get; set; }

    public int SafehousesOverCapacity { get; set; }
    public int ResidentsMissingRiskLevel { get; set; }
}

