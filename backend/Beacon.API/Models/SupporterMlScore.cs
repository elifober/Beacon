using System.ComponentModel.DataAnnotations.Schema;

namespace Beacon.API.Models;

/// <summary>
/// Precomputed supporter churn probability + risk tier from the donor-churn pipeline.
/// Read-only; refreshed via batch CSV import into Supabase.
/// </summary>
public partial class SupporterMlScore
{
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int SupporterId { get; set; }

    public double? ChurnProbability { get; set; }
    public string? RiskTier { get; set; }
}
