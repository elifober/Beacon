using System.ComponentModel.DataAnnotations.Schema;

namespace Beacon.API.Models;

/// <summary>
/// Precomputed ML risk scores for a resident, populated from the incident-risk
/// and reintegration-readiness pipelines. Read-only from the API's perspective;
/// rows are refreshed via batch CSV import into Supabase.
/// </summary>
public partial class ResidentMlScore
{
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int ResidentId { get; set; }

    public double? IncidentRiskScore { get; set; }
    public string? IncidentRiskBand { get; set; }

    public double? ReintegrationScore { get; set; }
    public string? ReintegrationBand { get; set; }
}
