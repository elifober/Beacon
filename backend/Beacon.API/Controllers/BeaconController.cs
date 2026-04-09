using Beacon.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Beacon.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Beacon.API.Controllers;

[Route("[controller]")]
[ApiController]

public class BeaconController : ControllerBase
{
    private readonly AuthIdentityDbContext _beaconContext;
    private readonly ILogger<BeaconController> _logger;

    public BeaconController(AuthIdentityDbContext temp, ILogger<BeaconController> logger)
    {
        _beaconContext = temp;
        _logger = logger;
    }

    /// <summary>
    /// Loads a related collection; returns an empty list if the query fails (e.g. table not migrated on prod).
    /// Uses a typed list so System.Text.Json can serialize the response (boxed <c>object</c> + anonymous types often breaks JSON).
    /// </summary>
    private List<T> TryLoadResidentRelated<T>(Func<List<T>> load, string datasetName, int residentId)
    {
        try
        {
            return load();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "GetResident: could not load {Dataset} for resident {ResidentId}. Run EF migrations against production if this table should exist.",
                datasetName,
                residentId);
            return new List<T>();
        }
    }

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
        // Do not inner-join Safehouses here: a bad/missing FK would yield 404 even though the resident exists.
        var r = _beaconContext.Residents.AsNoTracking().FirstOrDefault(x => x.ResidentId == id);
        if (r == null) return NotFound();

        var safehouse = _beaconContext.Safehouses.AsNoTracking()
            .FirstOrDefault(s => s.SafehouseId == r.SafehouseId);

        var educationRecords = TryLoadResidentRelated(
            () => _beaconContext.Set<EducationRecord>()
                .Where(e => e.ResidentId == id)
                .OrderByDescending(e => e.RecordDate)
                .Select(e => new ResidentEducationRecordRow
                {
                    EducationRecordId = e.EducationRecordId,
                    RecordDate = e.RecordDate,
                    EducationLevel = e.EducationLevel,
                    SchoolName = e.SchoolName,
                    EnrollmentStatus = e.EnrollmentStatus,
                    AttendanceRate = e.AttendanceRate,
                    ProgressPercent = e.ProgressPercent,
                    CompletionStatus = e.CompletionStatus,
                    Notes = e.Notes,
                })
                .ToList(),
            "education_records",
            id);

        var healthWellbeingRecords = TryLoadResidentRelated(
            () => _beaconContext.Set<HealthWellbeingRecord>()
                .Where(h => h.ResidentId == id)
                .OrderByDescending(h => h.RecordDate)
                .Select(h => new ResidentHealthWellbeingRecordRow
                {
                    HealthRecordId = h.HealthRecordId,
                    RecordDate = h.RecordDate,
                    GeneralHealthScore = h.GeneralHealthScore,
                    NutritionScore = h.NutritionScore,
                    SleepQualityScore = h.SleepQualityScore,
                    EnergyLevelScore = h.EnergyLevelScore,
                    HeightCm = h.HeightCm,
                    WeightKg = h.WeightKg,
                    Bmi = h.Bmi,
                    MedicalCheckupDone = h.MedicalCheckupDone,
                    DentalCheckupDone = h.DentalCheckupDone,
                    PsychologicalCheckupDone = h.PsychologicalCheckupDone,
                    Notes = h.Notes,
                })
                .ToList(),
            "health_wellbeing_records",
            id);

        var processRecordings = TryLoadResidentRelated(
            () => _beaconContext.Set<ProcessRecording>()
                .Where(p => p.ResidentId == id)
                .OrderByDescending(p => p.SessionDate)
                .Select(p => new ResidentProcessRecordingRow
                {
                    RecordingId = p.RecordingId,
                    SessionDate = p.SessionDate,
                    SocialWorker = p.SocialWorker,
                    SessionType = p.SessionType,
                    SessionDurationMinutes = p.SessionDurationMinutes,
                    EmotionalStateObserved = p.EmotionalStateObserved,
                    EmotionalStateEnd = p.EmotionalStateEnd,
                    InterventionsApplied = p.InterventionsApplied,
                    FollowUpActions = p.FollowUpActions,
                    ProgressNoted = p.ProgressNoted,
                    ConcernsFlagged = p.ConcernsFlagged,
                    ReferralMade = p.ReferralMade,
                    SessionNarrative = p.SessionNarrative,
                    NotesRestricted = p.NotesRestricted,
                })
                .ToList(),
            "process_recordings",
            id);

        var homeVisitations = TryLoadResidentRelated(
            () => _beaconContext.Set<HomeVisitation>()
                .Where(v => v.ResidentId == id)
                .OrderByDescending(v => v.VisitDate)
                .Select(v => new ResidentHomeVisitationRow
                {
                    VisitationId = v.VisitationId,
                    VisitDate = v.VisitDate,
                    SocialWorker = v.SocialWorker,
                    VisitType = v.VisitType,
                    LocationVisited = v.LocationVisited,
                    Purpose = v.Purpose,
                    Observations = v.Observations,
                    FamilyCooperationLevel = v.FamilyCooperationLevel,
                    SafetyConcernsNoted = v.SafetyConcernsNoted,
                    FollowUpNeeded = v.FollowUpNeeded,
                    FollowUpNotes = v.FollowUpNotes,
                    VisitOutcome = v.VisitOutcome,
                })
                .ToList(),
            "home_visitations",
            id);

        var incidentReports = TryLoadResidentRelated(
            () => _beaconContext.Set<IncidentReport>()
                .Where(i => i.ResidentId == id)
                .OrderByDescending(i => i.IncidentDate)
                .Join(_beaconContext.Safehouses,
                    i => i.SafehouseId,
                    sh => sh.SafehouseId,
                    (i, sh) => new ResidentIncidentReportRow
                    {
                        IncidentId = i.IncidentId,
                        IncidentDate = i.IncidentDate,
                        IncidentType = i.IncidentType,
                        Severity = i.Severity,
                        Description = i.Description,
                        ResponseTaken = i.ResponseTaken,
                        Resolved = i.Resolved,
                        ResolutionDate = i.ResolutionDate,
                        ReportedBy = i.ReportedBy,
                        FollowUpRequired = i.FollowUpRequired,
                        SafehouseName = sh.Name,
                    })
                .ToList(),
            "incident_reports",
            id);

        return Ok(new
        {
            Name = (r.FirstName ?? "") + " " + (r.LastInitial ?? ""),
            r.DateOfBirth,
            r.Sex,
            r.CaseStatus,
            SafehouseCity = safehouse?.City,
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
