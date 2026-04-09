using Beacon.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Beacon.API.Controllers;

[Route("[controller]")]
[ApiController]
public class RiskController : ControllerBase
{
    private readonly AuthIdentityDbContext _db;

    public RiskController(AuthIdentityDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Per-resident risk view: joins ml_scores with residents so the admin dashboard
    /// can show names + safehouse alongside incident risk and reintegration readiness.
    /// </summary>
    [HttpGet("Residents")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> GetResidentRisks()
    {
        var rows = await (
            from s in _db.ResidentMlScores.AsNoTracking()
            join r in _db.Residents.AsNoTracking() on s.ResidentId equals r.ResidentId
            join sh in _db.Safehouses.AsNoTracking() on r.SafehouseId equals sh.SafehouseId into shj
            from sh in shj.DefaultIfEmpty()
            select new
            {
                s.ResidentId,
                Name = ((r.FirstName ?? "") + " " + (r.LastInitial ?? "")).Trim(),
                SafehouseCity = sh != null ? sh.City : null,
                r.CaseStatus,
                s.IncidentRiskScore,
                s.IncidentRiskBand,
                s.ReintegrationScore,
                s.ReintegrationBand,
            }
        ).ToListAsync();

        return Ok(rows);
    }

    /// <summary>
    /// Per-supporter churn view: joins supporter_ml_scores with supporters for
    /// display names + type in the churn-risk table.
    /// </summary>
    [HttpGet("Supporters")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> GetSupporterRisks()
    {
        var rows = await (
            from s in _db.SupporterMlScores.AsNoTracking()
            join sup in _db.Supporters.AsNoTracking() on s.SupporterId equals sup.SupporterId
            select new
            {
                s.SupporterId,
                Name = sup.DisplayName
                    ?? (((sup.FirstName ?? "") + " " + (sup.LastName ?? "")).Trim()),
                sup.SupporterType,
                sup.Status,
                s.ChurnProbability,
                s.RiskTier,
            }
        ).ToListAsync();

        return Ok(rows);
    }

    /// <summary>
    /// Summary counts for the top-of-dashboard cards.
    /// </summary>
    [HttpGet("Summary")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> GetSummary()
    {
        var residentBands = await _db.ResidentMlScores.AsNoTracking()
            .GroupBy(s => s.IncidentRiskBand ?? "Unknown")
            .Select(g => new { Band = g.Key, Count = g.Count() })
            .ToListAsync();

        var reintegrationBands = await _db.ResidentMlScores.AsNoTracking()
            .GroupBy(s => s.ReintegrationBand ?? "Unknown")
            .Select(g => new { Band = g.Key, Count = g.Count() })
            .ToListAsync();

        var supporterTiers = await _db.SupporterMlScores.AsNoTracking()
            .GroupBy(s => s.RiskTier ?? "Unknown")
            .Select(g => new { Tier = g.Key, Count = g.Count() })
            .ToListAsync();

        return Ok(new
        {
            ResidentIncidentBands = residentBands,
            ResidentReintegrationBands = reintegrationBands,
            SupporterChurnTiers = supporterTiers,
        });
    }
}
