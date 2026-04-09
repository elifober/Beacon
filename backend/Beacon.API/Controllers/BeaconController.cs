using Beacon.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Beacon.API.Data;
using Microsoft.EntityFrameworkCore;

namespace Beacon.API.Controllers;

[Route("[controller]")]
[ApiController]

public class BeaconController : ControllerBase
{
    private AuthIdentityDbContext _beaconContext;

    public BeaconController(AuthIdentityDbContext temp) => _beaconContext = temp;

    //GET LIST OF ALL RESIDENTS
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpGet("Residents")]
    public IActionResult GetResidentList()
    {
        var residents = _beaconContext.Residents
            .Join(_beaconContext.Safehouses,
                r => r.SafehouseId,
                s => s.SafehouseId,
                (r, s) => new
                {
                    r.ResidentId,
                    Name = (r.FirstName ?? "") + " " + (r.LastInitial ?? ""),
                    SafehouseName = s.City,
                    r.CaseStatus,
                    r.Sex,
                    r.DateOfBirth
                })
            .ToList();

        return Ok(residents);
    }

    //GET LIST OF ALL SAFEHOUSES
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpGet("Safehouses")]
    public IEnumerable<Safehouse> GetSafehouses() => _beaconContext.Safehouses.ToList();

    //GET LIST OF ALL PARTNERS
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpGet("Partners")]
    public IEnumerable<Partner> GetPartner() => _beaconContext.Partners.ToList();

    [HttpGet("admin/residents")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> GetResidentsForAdmin()
    {
        var residents = await _beaconContext.Residents.ToListAsync();
        return Ok(residents);
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> CreateResident([FromBody] Resident resident)
    {
        resident.ResidentId = await _beaconContext.AllocateNextResidentIdAsync();
        _beaconContext.Residents.Add(resident);
        await _beaconContext.SaveChangesAsync();
        return Created($"/residents/{resident.ResidentId}", resident);
    }

    //SEARCH BAR FUNCTIONALITY
    [HttpGet("Search")]
    public OkObjectResult Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(Array.Empty<object>());

        var query = q.Trim().ToLower();
        
        var supporters = _beaconContext.Supporters
            .Where(s => (s.DisplayName ?? "").ToLower().Contains(query)
                        || (s.FirstName ?? "").ToLower().Contains(query)
                        || (s.LastName ?? "").ToLower().Contains(query)
                        || (s.OrganizationName ?? "").ToLower().Contains(query))
            .Select(s => new
            {
                Id = s.SupporterId,
                Name = s.DisplayName ?? (s.FirstName + " " + s.LastName),
                Type = "Donor"
            })
            .ToList();

        var partners = _beaconContext.Partners
            .Where(p => p.PartnerName.ToLower().Contains(query)
                        || (p.ContactName ?? "").ToLower().Contains(query))
            .Select(p => new
            {
                Id = p.PartnerId,
                Name = p.PartnerName,
                Type = "Partner"
            })
            .ToList();
        var safehouses = _beaconContext.Safehouses
            .Where(s => s.Name.ToLower().Contains(query)
                        || s.SafehouseCode.ToLower().Contains(query))
            .Select(s => new
            {
                Id = s.SafehouseId,
                Name = s.Name,
                Type = "Safehouse"
            })
            .ToList();
        var residents = _beaconContext.Residents
            .Where(r => (r.FirstName ?? "").ToLower().Contains(query)
                        || (r.LastInitial ?? "").ToLower().Contains(query)
                        || (r.CaseControlNo ?? "").ToLower().Contains(query))
            .Select(r => new
            {
                Id = r.ResidentId,
                Name = (r.FirstName ?? "") + " " + (r.LastInitial ?? ""),
                Type = "Resident"
            })
            .ToList();

        var results = supporters.Cast<object>()
            .Concat(partners)
            .Concat(safehouses)
            .Concat(residents)
            .ToList();
        return Ok(results);
    }

    //GET THE PERCENTAGE OF DONATIONS ALLOCATED TO EACH PROGRAM
    [HttpGet("Allocations")]
    public IEnumerable<object> GetAllocationList()
    {
        return _beaconContext.DonationAllocations
            .Select(d => new
            {
                d.DonationId,
                d.ProgramArea,
                d.AmountAllocated
            })
            .ToList();
    }

    //GET SINGLE RESIDENT WITH SAFEHOUSE CITY AND RELATED RECORDS
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpGet("Resident/{id}")]
    public IActionResult GetResident(int id)
    {
        var row = _beaconContext.Residents
            .Where(r => r.ResidentId == id)
            .Join(_beaconContext.Safehouses,
                r => r.SafehouseId,
                s => s.SafehouseId,
                (r, s) => new { r, s })
            .FirstOrDefault();

        if (row == null) return NotFound();

        var r = row.r;
        var s = row.s;

        var educationRecords = _beaconContext.Set<EducationRecord>()
            .Where(e => e.ResidentId == id)
            .OrderByDescending(e => e.RecordDate)
            .Select(e => new
            {
                e.EducationRecordId,
                e.RecordDate,
                e.EducationLevel,
                e.SchoolName,
                e.EnrollmentStatus,
                e.AttendanceRate,
                e.ProgressPercent,
                e.CompletionStatus,
                e.Notes,
            })
            .ToList();

        var healthWellbeingRecords = _beaconContext.Set<HealthWellbeingRecord>()
            .Where(h => h.ResidentId == id)
            .OrderByDescending(h => h.RecordDate)
            .Select(h => new
            {
                h.HealthRecordId,
                h.RecordDate,
                h.GeneralHealthScore,
                h.NutritionScore,
                h.SleepQualityScore,
                h.EnergyLevelScore,
                h.HeightCm,
                h.WeightKg,
                h.Bmi,
                h.MedicalCheckupDone,
                h.DentalCheckupDone,
                h.PsychologicalCheckupDone,
                h.Notes,
            })
            .ToList();

        var processRecordings = _beaconContext.Set<ProcessRecording>()
            .Where(p => p.ResidentId == id)
            .OrderByDescending(p => p.SessionDate)
            .Select(p => new
            {
                p.RecordingId,
                p.SessionDate,
                p.SocialWorker,
                p.SessionType,
                p.SessionDurationMinutes,
                p.EmotionalStateObserved,
                p.EmotionalStateEnd,
                p.InterventionsApplied,
                p.FollowUpActions,
                p.ProgressNoted,
                p.ConcernsFlagged,
                p.ReferralMade,
                p.SessionNarrative,
                p.NotesRestricted,
            })
            .ToList();

        var homeVisitations = _beaconContext.Set<HomeVisitation>()
            .Where(v => v.ResidentId == id)
            .OrderByDescending(v => v.VisitDate)
            .Select(v => new
            {
                v.VisitationId,
                v.VisitDate,
                v.SocialWorker,
                v.VisitType,
                v.LocationVisited,
                v.Purpose,
                v.Observations,
                v.FamilyCooperationLevel,
                v.SafetyConcernsNoted,
                v.FollowUpNeeded,
                v.FollowUpNotes,
                v.VisitOutcome,
            })
            .ToList();

        var incidentReports = _beaconContext.Set<IncidentReport>()
            .Where(i => i.ResidentId == id)
            .OrderByDescending(i => i.IncidentDate)
            .Join(_beaconContext.Safehouses,
                i => i.SafehouseId,
                sh => sh.SafehouseId,
                (i, sh) => new
                {
                    i.IncidentId,
                    i.IncidentDate,
                    i.IncidentType,
                    i.Severity,
                    i.Description,
                    i.ResponseTaken,
                    i.Resolved,
                    i.ResolutionDate,
                    i.ReportedBy,
                    i.FollowUpRequired,
                    SafehouseName = sh.Name,
                })
            .ToList();

        return Ok(new
        {
            Name = (r.FirstName ?? "") + " " + (r.LastInitial ?? ""),
            r.DateOfBirth,
            r.Sex,
            r.CaseStatus,
            SafehouseCity = s.City,
            r.LengthOfStay,
            r.CurrentRiskLevel,
            educationRecords,
            healthWellbeingRecords,
            processRecordings,
            homeVisitations,
            incidentReports,
        });
    }

    //GET SINGLE DONOR WITH FULL DONATION HISTORY
    [Authorize(Policy = AuthPolicies.DonorOnly)]
    [HttpGet("Donor/{id}")]
    public IActionResult GetDonor(int id)
    {
        var supporter = _beaconContext.Supporters.FirstOrDefault(s => s.SupporterId == id);
        if (supporter == null) return NotFound();

        var history = _beaconContext.Donations
            .Where(d => d.SupporterId == id)
            .Join(_beaconContext.DonationAllocations,
                d => d.DonationId,
                a => a.DonationId,
                (d, a) => new
                {
                    d.DonationType,
                    d.DonationDate,
                    d.Amount,
                    d.EstimatedValue,
                    d.ImpactUnit,
                    d.Notes,
                    a.ProgramArea
                })
            .OrderByDescending(x => x.DonationDate)
            .ToList();

        return Ok(new { supporter, donationHistory = history });
    }

    //GET SINGLE PARTNER WITH SAFEHOUSE ASSIGNMENTS
    [Authorize(Policy = AuthPolicies.PartnerOnly)]
    [HttpGet("Partner/{id}")]
    public IActionResult GetPartner(int id)
    {
        var partner = _beaconContext.Partners.FirstOrDefault(p => p.PartnerId == id);
        if (partner == null) return NotFound();

        var assignments = _beaconContext.PartnerAssignments
            .Where(pa => pa.PartnerId == id)
            .Join(_beaconContext.Safehouses,
                pa => pa.SafehouseId,
                s => s.SafehouseId,
                (pa, s) => new
                {
                    SafehouseName = s.Name,
                    SafehouseCity = s.City,
                    pa.ProgramArea,
                    pa.Status
                })
            .ToList();

        return Ok(new { partner, safehouseAssignments = assignments });
    }

    //GET SINGLE SAFEHOUSE WITH ASSIGNED PARTNER NAMES
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpGet("Safehouse/{id}")]
    public IActionResult GetSafehouse(int id)
    {
        var safehouse = _beaconContext.Safehouses.FirstOrDefault(s => s.SafehouseId == id);
        if (safehouse == null) return NotFound();

        var partners = _beaconContext.PartnerAssignments
            .Where(pa => pa.SafehouseId == id)
            .Join(_beaconContext.Partners,
                pa => pa.PartnerId,
                p => p.PartnerId,
                (pa, p) => p.PartnerName)
            .Distinct()
            .ToList();

        return Ok(new { safehouse, assignedPartners = partners });
    }

    //ADMIN: ALL RESIDENTS WITH SAFEHOUSE CITY
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpGet("AllResidents")]
    public IActionResult GetAllResidents()
    {
        var residents = _beaconContext.Residents
            .Join(_beaconContext.Safehouses,
                r => r.SafehouseId,
                s => s.SafehouseId,
                (r, s) => new
                {
                    r.ResidentId,
                    Name = (r.FirstName ?? "") + " " + (r.LastInitial ?? ""),
                    SafehouseCity = s.City,
                    r.Sex,
                    r.DateOfBirth,
                    r.Religion,
                    r.CaseCategory,
                    r.CaseStatus,
                    r.DateOfAdmission,
                    r.ReintegrationStatus,
                    r.CurrentRiskLevel
                })
            .ToList();
        return Ok(residents);
    }

    //ADMIN: ALL PARTNERS WITH ASSIGNED SAFEHOUSE
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpGet("AllPartners")]
    public IActionResult GetAllPartners()
    {
        var partners = _beaconContext.Partners
            .GroupJoin(_beaconContext.PartnerAssignments,
                p => p.PartnerId,
                pa => pa.PartnerId,
                (p, assignments) => new { p, assignments })
            .SelectMany(
                x => x.assignments
                    .Join(_beaconContext.Safehouses,
                        pa => pa.SafehouseId,
                        s => s.SafehouseId,
                        (pa, s) => s.City)
                    .DefaultIfEmpty(),
                (x, city) => new
                {
                    x.p.PartnerId,
                    x.p.PartnerName,
                    OrganizationType = x.p.PartnerType,
                    x.p.RoleType,
                    x.p.Email,
                    x.p.Phone,
                    x.p.Region,
                    x.p.Status,
                    x.p.StartDate,
                    AssignedSafehouse = city
                })
            .ToList();
        return Ok(partners);
    }

    //ADMIN: ALL DONORS
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpGet("AllDonors")]
    public IActionResult GetAllDonors()
    {
        var donors = _beaconContext.Supporters
            .Select(s => new
            {
                DonorId = s.SupporterId,
                s.DisplayName,
                Relationship = s.RelationshipType,
                s.Region,
                s.Country,
                s.Email,
                s.Phone,
                s.Status,
                FirstDonation = s.FirstDonationDate,
                s.AcquisitionChannel
            })
            .ToList();
        return Ok(donors);
    }

    //ADMIN: ALL DONATIONS WITH SUPPORTER NAME AND ALLOCATIONS
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpGet("AllDonations")]
    public IActionResult GetAllDonations()
    {
        var donations = _beaconContext.Donations
            .Join(_beaconContext.Supporters,
                d => d.SupporterId,
                s => s.SupporterId,
                (d, s) => new { d, SupporterName = s.DisplayName ?? (s.FirstName + " " + s.LastName) })
            .Join(_beaconContext.DonationAllocations,
                x => x.d.DonationId,
                a => a.DonationId,
                (x, a) => new
                {
                    x.d.DonationId,
                    x.SupporterName,
                    x.d.DonationType,
                    x.d.DonationDate,
                    x.d.IsRecurring,
                    x.d.Amount,
                    x.d.EstimatedValue,
                    x.d.ImpactUnit,
                    a.ProgramArea,
                    x.d.Notes
                })
            .OrderByDescending(x => x.DonationDate)
            .ToList();
        return Ok(donations);
    }

    //GET DONOR DASHBOARD: personal info + donation history with program areas
    [Authorize(Policy = AuthPolicies.DonorOnly)]
    [HttpGet("DonorDashboard/{id}")]
    public IActionResult GetDonorDashboard(int id)
    {
        var supporter = _beaconContext.Supporters.FirstOrDefault(s => s.SupporterId == id);
        if (supporter == null) return NotFound();

        var history = _beaconContext.Donations
            .Where(d => d.SupporterId == id)
            .Join(_beaconContext.DonationAllocations,
                d => d.DonationId,
                a => a.DonationId,
                (d, a) => new
                {
                    d.DonationType,
                    d.DonationDate,
                    d.Amount,
                    d.EstimatedValue,
                    d.ImpactUnit,
                    a.ProgramArea
                })
            .OrderByDescending(x => x.DonationDate)
            .ToList();

        return Ok(new { supporter, donationHistory = history });
    }
}
