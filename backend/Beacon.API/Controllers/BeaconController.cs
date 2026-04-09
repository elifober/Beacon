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

    /// <summary>
    /// Landing page: share of total <c>amount_allocated</c> by <c>program_area</c> (table <c>donation_allocations</c>).
    /// Up to four rows; if more than four distinct areas exist, the top three are shown plus an "Other" bucket.
    /// </summary>
    [HttpGet("Impact/ProgramAreaPercentages")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<ProgramAreaAllocationShareDto>>> GetProgramAreaAllocationPercentages(
        CancellationToken cancellationToken = default)
    {
        try
        {
            var rows = await _beaconContext.DonationAllocations
                .AsNoTracking()
                .Where(a => a.AmountAllocated.HasValue && a.AmountAllocated.Value > 0)
                .Select(a => new
                {
                    Area = string.IsNullOrWhiteSpace(a.ProgramArea) ? "General" : a.ProgramArea!.Trim(),
                    Amount = a.AmountAllocated!.Value,
                })
                .ToListAsync(cancellationToken);

            var total = rows.Sum(r => r.Amount);
            if (total <= 0)
                return Ok(Array.Empty<ProgramAreaAllocationShareDto>());

            var grouped = rows
                .GroupBy(r => r.Area)
                .Select(g => new { Area = g.Key, Amount = g.Sum(x => x.Amount) })
                .OrderByDescending(x => x.Amount)
                .ToList();

            List<(string Area, decimal Amount)> display;
            if (grouped.Count <= 4)
            {
                display = grouped.Select(g => (g.Area, g.Amount)).ToList();
            }
            else
            {
                var top3 = grouped.Take(3).Select(g => (g.Area, g.Amount)).ToList();
                var otherAmount = grouped.Skip(3).Sum(g => g.Amount);
                display = top3;
                display.Add(("Other", otherAmount));
            }

            var result = display
                .Select(d => new ProgramAreaAllocationShareDto
                {
                    ProgramArea = d.Area,
                    AmountAllocated = d.Amount,
                    PercentOfTotal = Math.Round(100m * d.Amount / total, 1, MidpointRounding.AwayFromZero),
                })
                .ToList();

            var sumPct = result.Sum(r => r.PercentOfTotal);
            if (result.Count > 0 && Math.Abs(sumPct - 100m) > 0.05m)
            {
                var drift = 100m - sumPct;
                result[0].PercentOfTotal = Math.Round(result[0].PercentOfTotal + drift, 1, MidpointRounding.AwayFromZero);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Impact/ProgramAreaPercentages: failed to read donation_allocations.");
            return Ok(Array.Empty<ProgramAreaAllocationShareDto>());
        }
    }

    //GET SINGLE RESIDENT WITH SAFEHOUSE CITY AND RELATED RECORDS
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpGet("Resident/{id}")]
    public IActionResult GetResident(int id)
    {
        // Project only columns needed for this endpoint. Loading the full Resident entity reads every DateOnly?
        // column; legacy/imported rows can have values or DB types that fail materialization even when
        // AllResidents (narrower projection) still works.
        var r = _beaconContext.Residents.AsNoTracking()
            .Where(x => x.ResidentId == id)
            .Select(x => new
            {
                x.FirstName,
                x.LastInitial,
                x.DateOfBirth,
                x.Sex,
                x.CaseStatus,
                x.SafehouseId,
                x.LengthOfStay,
                x.CurrentRiskLevel,
            })
            .FirstOrDefault();
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
                    FamilyMembersPresent = v.FamilyMembersPresent,
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

        // Two-step load avoids GroupJoin/DefaultIfEmpty translation edge cases on some PostgreSQL/EF versions.
        var incidentReports = TryLoadResidentRelated(
            () =>
            {
                var incidents = _beaconContext.Set<IncidentReport>()
                    .AsNoTracking()
                    .Where(i => i.ResidentId == id)
                    .OrderByDescending(i => i.IncidentDate)
                    .Select(i => new
                    {
                        i.IncidentId,
                        i.SafehouseId,
                        i.IncidentDate,
                        i.IncidentType,
                        i.Severity,
                        i.Description,
                        i.ResponseTaken,
                        i.Resolved,
                        i.ResolutionDate,
                        i.ReportedBy,
                        i.FollowUpRequired,
                    })
                    .ToList();
                var shIds = incidents.Select(i => i.SafehouseId).Distinct().ToList();
                var safehouseCities = _beaconContext.Safehouses.AsNoTracking()
                    .Where(sh => shIds.Contains(sh.SafehouseId))
                    .ToDictionary(sh => sh.SafehouseId, sh => sh.City);
                return incidents.ConvertAll(i => new ResidentIncidentReportRow
                {
                    IncidentId = i.IncidentId,
                    SafehouseId = i.SafehouseId,
                    IncidentDate = i.IncidentDate,
                    IncidentType = i.IncidentType,
                    Severity = i.Severity,
                    Description = i.Description,
                    ResponseTaken = i.ResponseTaken,
                    Resolved = i.Resolved,
                    ResolutionDate = i.ResolutionDate,
                    ReportedBy = i.ReportedBy,
                    FollowUpRequired = i.FollowUpRequired,
                    SafehouseCity = safehouseCities.TryGetValue(i.SafehouseId, out var c) ? c : null,
                });
            },
            "incident_reports",
            id);

        return Ok(new
        {
            Name = (r.FirstName ?? "") + " " + (r.LastInitial ?? ""),
            r.DateOfBirth,
            r.Sex,
            r.CaseStatus,
            SafehouseId = r.SafehouseId,
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

    /// <summary>Distinct school names from existing records plus a small default list for new entries.</summary>
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpGet("EducationRecordSchoolNames")]
    public IActionResult GetEducationRecordSchoolNames()
    {
        try
        {
            var fromDb = _beaconContext.Set<EducationRecord>()
                .AsNoTracking()
                .Where(e => e.SchoolName != null && e.SchoolName != "")
                .Select(e => e.SchoolName!)
                .Distinct()
                .ToList();
            string[] defaults =
            [
                "Beacon Learning Center",
                "Community High School",
                "Online Academy",
                "GED Preparation Program",
            ];
            var merged = fromDb
                .Concat(defaults)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(s => s, StringComparer.OrdinalIgnoreCase)
                .ToList();
            return Ok(merged);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "GetEducationRecordSchoolNames failed.");
            return Ok(Array.Empty<string>());
        }
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpGet("ProcessRecordingPicklists")]
    public IActionResult GetProcessRecordingPicklists()
    {
        try
        {
            var sessionTypes = _beaconContext.Set<ProcessRecording>().AsNoTracking()
                .Where(p => p.SessionType != null && p.SessionType != "")
                .Select(p => p.SessionType!).Distinct().ToList();
            var emotionalObs = _beaconContext.Set<ProcessRecording>().AsNoTracking()
                .Where(p => p.EmotionalStateObserved != null && p.EmotionalStateObserved != "")
                .Select(p => p.EmotionalStateObserved!).Distinct().ToList();
            var emotionalEnd = _beaconContext.Set<ProcessRecording>().AsNoTracking()
                .Where(p => p.EmotionalStateEnd != null && p.EmotionalStateEnd != "")
                .Select(p => p.EmotionalStateEnd!).Distinct().ToList();

            string[] defSession = ["Initial Assessment", "Follow-up Session", "Check-in", "Crisis Support"];
            string[] defEmotional = ["Calm", "Stable", "Anxious", "Low", "Distressed", "Hopeful"];

            return Ok(new ProcessRecordingPicklistsResponse
            {
                SessionTypes = MergeDistinctStrings(sessionTypes, defSession),
                EmotionalStatesObserved = MergeDistinctStrings(emotionalObs, defEmotional),
                EmotionalStatesEnd = MergeDistinctStrings(emotionalEnd, defEmotional),
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "GetProcessRecordingPicklists failed.");
            return Ok(new ProcessRecordingPicklistsResponse());
        }
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpGet("HomeVisitationPicklists")]
    public IActionResult GetHomeVisitationPicklists()
    {
        try
        {
            var visitTypes = _beaconContext.Set<HomeVisitation>().AsNoTracking()
                .Where(v => v.VisitType != null && v.VisitType != "")
                .Select(v => v.VisitType!).Distinct().ToList();
            var coop = _beaconContext.Set<HomeVisitation>().AsNoTracking()
                .Where(v => v.FamilyCooperationLevel != null && v.FamilyCooperationLevel != "")
                .Select(v => v.FamilyCooperationLevel!).Distinct().ToList();
            var outcomes = _beaconContext.Set<HomeVisitation>().AsNoTracking()
                .Where(v => v.VisitOutcome != null && v.VisitOutcome != "")
                .Select(v => v.VisitOutcome!).Distinct().ToList();

            string[] defVisit = ["Scheduled", "Unscheduled", "Follow-up"];
            string[] defCoop = ["High", "Medium", "Low", "Mixed"];
            string[] defOut = ["Successful", "Partial", "Deferred", "No change"];

            return Ok(new HomeVisitationPicklistsResponse
            {
                VisitTypes = MergeDistinctStrings(visitTypes, defVisit),
                FamilyCooperationLevels = MergeDistinctStrings(coop, defCoop),
                VisitOutcomes = MergeDistinctStrings(outcomes, defOut),
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "GetHomeVisitationPicklists failed.");
            return Ok(new HomeVisitationPicklistsResponse());
        }
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpGet("IncidentReportPicklists")]
    public IActionResult GetIncidentReportPicklists()
    {
        try
        {
            var types = _beaconContext.Set<IncidentReport>().AsNoTracking()
                .Where(i => i.IncidentType != null && i.IncidentType != "")
                .Select(i => i.IncidentType!).Distinct().ToList();
            var sev = _beaconContext.Set<IncidentReport>().AsNoTracking()
                .Where(i => i.Severity != null && i.Severity != "")
                .Select(i => i.Severity!).Distinct().ToList();

            string[] defTypes = ["Medical", "Behavioral", "Safety", "Property", "Other"];
            string[] defSev = ["Low", "Medium", "High", "Critical"];

            return Ok(new IncidentReportPicklistsResponse
            {
                IncidentTypes = MergeDistinctStrings(types, defTypes),
                Severities = MergeDistinctStrings(sev, defSev),
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "GetIncidentReportPicklists failed.");
            return Ok(new IncidentReportPicklistsResponse());
        }
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPost("EducationRecord")]
    public async Task<IActionResult> CreateEducationRecord([FromBody] CreateEducationRecordRequest? body)
    {
        if (body == null)
            return BadRequest(new { message = "Invalid request body.", errors = (object?)null });

        var errors = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        if (body.ResidentId <= 0)
            errors["resident_id"] = "Required";

        var residentExists = body.ResidentId > 0 &&
                             await _beaconContext.Residents.AsNoTracking()
                                 .AnyAsync(r => r.ResidentId == body.ResidentId);
        if (body.ResidentId > 0 && !residentExists)
            return NotFound(new { message = "Resident not found." });

        if (body.RecordDate == default)
            errors["record_date"] = "Required";

        if (string.IsNullOrWhiteSpace(body.SchoolName))
            errors["school_name"] = "Required";

        var enrollment = (body.EnrollmentStatus ?? "").Trim();
        if (enrollment is not ("Enrolled" or "Not Enrolled"))
            errors["enrollment_status"] = "Choose Enrolled or Not Enrolled.";

        var completion = (body.CompletionStatus ?? "").Trim();
        if (completion is not ("NotStarted" or "InProgress"))
            errors["completion_status"] = "Choose Not Started or In Progress.";

        if (body.AttendanceRate is null)
            errors["attendance_rate"] = "Required";
        else
        {
            var att = Math.Round(body.AttendanceRate.Value, 3, MidpointRounding.AwayFromZero);
            if (att < 0m || att > 1m)
                errors["attendance_rate"] = "Must be between 0 and 1.";
        }

        if (body.ProgressPercent is null)
            errors["progress_percent"] = "Required";
        else
        {
            var prog = Math.Round(body.ProgressPercent.Value, 1, MidpointRounding.AwayFromZero);
            if (prog < 0m || prog > 100m)
                errors["progress_percent"] = "Must be between 0 and 100.";
        }

        if (errors.Count > 0)
            return BadRequest(new
            {
                message = "Please complete all required fields.",
                errors,
            });

        var attendanceRounded = Math.Round(body.AttendanceRate!.Value, 3, MidpointRounding.AwayFromZero);
        var progressRounded = Math.Round(body.ProgressPercent!.Value, 1, MidpointRounding.AwayFromZero);

        var educationRecordId = await _beaconContext.AllocateNextEducationRecordIdAsync();
        var entity = new EducationRecord
        {
            EducationRecordId = educationRecordId,
            ResidentId = body.ResidentId,
            RecordDate = body.RecordDate,
            SchoolName = body.SchoolName.Trim(),
            EnrollmentStatus = enrollment,
            AttendanceRate = attendanceRounded,
            ProgressPercent = progressRounded,
            CompletionStatus = completion,
            Notes = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes.Trim(),
            EducationLevel = null,
        };

        _beaconContext.Set<EducationRecord>().Add(entity);
        await _beaconContext.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created,
            new CreateEducationRecordResult { EducationRecordId = entity.EducationRecordId });
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPost("HealthWellbeingRecord")]
    public async Task<IActionResult> CreateHealthWellbeingRecord([FromBody] CreateHealthWellbeingRecordRequest? body)
    {
        if (body == null)
            return BadRequest(new { message = "Invalid request body.", errors = (object?)null });

        var errors = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (body.ResidentId <= 0)
            errors["resident_id"] = "Required";
        else if (!await _beaconContext.Residents.AsNoTracking().AnyAsync(x => x.ResidentId == body.ResidentId))
            return NotFound(new { message = "Resident not found." });

        if (body.RecordDate == default)
            errors["record_date"] = "Required";

        AddHealthScore0To5(errors, body.GeneralHealthScore, "general_health_score");
        AddHealthScore0To5(errors, body.NutritionScore, "nutrition_score");
        AddHealthScore0To5(errors, body.SleepQualityScore, "sleep_quality_score");
        AddHealthScore0To5(errors, body.EnergyLevelScore, "energy_level_score");

        if (errors.Count > 0)
            return BadRequest(new { message = "Please complete all required fields.", errors });

        var healthRecordId = await _beaconContext.AllocateNextHealthRecordIdAsync();
        var entity = new HealthWellbeingRecord
        {
            HealthRecordId = healthRecordId,
            ResidentId = body.ResidentId,
            RecordDate = body.RecordDate,
            GeneralHealthScore = body.GeneralHealthScore,
            NutritionScore = body.NutritionScore,
            SleepQualityScore = body.SleepQualityScore,
            EnergyLevelScore = body.EnergyLevelScore,
            HeightCm = body.HeightCm,
            WeightKg = body.WeightKg,
            Bmi = body.Bmi,
            MedicalCheckupDone = body.MedicalCheckupDone,
            DentalCheckupDone = body.DentalCheckupDone,
            PsychologicalCheckupDone = body.PsychologicalCheckupDone,
            Notes = NullIfWhiteSpace(body.Notes),
        };
        _beaconContext.Set<HealthWellbeingRecord>().Add(entity);
        await _beaconContext.SaveChangesAsync();
        return StatusCode(StatusCodes.Status201Created,
            new CreateHealthWellbeingRecordResult { HealthRecordId = entity.HealthRecordId });
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPost("ProcessRecording")]
    public async Task<IActionResult> CreateProcessRecording([FromBody] CreateProcessRecordingRequest? body)
    {
        if (body == null)
            return BadRequest(new { message = "Invalid request body.", errors = (object?)null });

        var errors = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (body.ResidentId <= 0)
            errors["resident_id"] = "Required";
        else if (!await _beaconContext.Residents.AsNoTracking().AnyAsync(x => x.ResidentId == body.ResidentId))
            return NotFound(new { message = "Resident not found." });

        if (body.SessionDate == default)
            errors["session_date"] = "Required";

        if (body.SessionDurationMinutes is < 0)
            errors["session_duration_minutes"] = "Must be zero or greater.";

        if (errors.Count > 0)
            return BadRequest(new { message = "Please complete all required fields.", errors });

        var recordingId = await _beaconContext.AllocateNextProcessRecordingIdAsync();
        var entity = new ProcessRecording
        {
            RecordingId = recordingId,
            ResidentId = body.ResidentId,
            SessionDate = body.SessionDate,
            SocialWorker = NullIfWhiteSpace(body.SocialWorker),
            SessionType = NullIfWhiteSpace(body.SessionType),
            SessionDurationMinutes = body.SessionDurationMinutes,
            EmotionalStateObserved = NullIfWhiteSpace(body.EmotionalStateObserved),
            EmotionalStateEnd = NullIfWhiteSpace(body.EmotionalStateEnd),
            SessionNarrative = NullIfWhiteSpace(body.SessionNarrative),
            InterventionsApplied = NullIfWhiteSpace(body.InterventionsApplied),
            FollowUpActions = NullIfWhiteSpace(body.FollowUpActions),
            ProgressNoted = body.ProgressNoted,
            ConcernsFlagged = body.ConcernsFlagged,
            ReferralMade = body.ReferralMade,
            NotesRestricted = NullIfWhiteSpace(body.NotesRestricted),
        };
        _beaconContext.Set<ProcessRecording>().Add(entity);
        await _beaconContext.SaveChangesAsync();
        return StatusCode(StatusCodes.Status201Created,
            new CreateProcessRecordingResult { RecordingId = entity.RecordingId });
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPost("HomeVisitation")]
    public async Task<IActionResult> CreateHomeVisitation([FromBody] CreateHomeVisitationRequest? body)
    {
        if (body == null)
            return BadRequest(new { message = "Invalid request body.", errors = (object?)null });

        var errors = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (body.ResidentId <= 0)
            errors["resident_id"] = "Required";
        else if (!await _beaconContext.Residents.AsNoTracking().AnyAsync(x => x.ResidentId == body.ResidentId))
            return NotFound(new { message = "Resident not found." });

        if (body.VisitDate == default)
            errors["visit_date"] = "Required";

        if (errors.Count > 0)
            return BadRequest(new { message = "Please complete all required fields.", errors });

        var visitationId = await _beaconContext.AllocateNextHomeVisitationIdAsync();
        var entity = new HomeVisitation
        {
            VisitationId = visitationId,
            ResidentId = body.ResidentId,
            VisitDate = body.VisitDate,
            SocialWorker = NullIfWhiteSpace(body.SocialWorker),
            VisitType = NullIfWhiteSpace(body.VisitType),
            LocationVisited = NullIfWhiteSpace(body.LocationVisited),
            FamilyMembersPresent = NullIfWhiteSpace(body.FamilyMembersPresent),
            Purpose = NullIfWhiteSpace(body.Purpose),
            Observations = NullIfWhiteSpace(body.Observations),
            FamilyCooperationLevel = NullIfWhiteSpace(body.FamilyCooperationLevel),
            SafetyConcernsNoted = body.SafetyConcernsNoted,
            FollowUpNeeded = body.FollowUpNeeded,
            FollowUpNotes = NullIfWhiteSpace(body.FollowUpNotes),
            VisitOutcome = NullIfWhiteSpace(body.VisitOutcome),
        };
        _beaconContext.Set<HomeVisitation>().Add(entity);
        await _beaconContext.SaveChangesAsync();
        return StatusCode(StatusCodes.Status201Created,
            new CreateHomeVisitationResult { VisitationId = entity.VisitationId });
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPost("IncidentReport")]
    public async Task<IActionResult> CreateIncidentReport([FromBody] CreateIncidentReportRequest? body)
    {
        if (body == null)
            return BadRequest(new { message = "Invalid request body.", errors = (object?)null });

        var errors = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (body.ResidentId <= 0)
            errors["resident_id"] = "Required";
        else if (!await _beaconContext.Residents.AsNoTracking().AnyAsync(x => x.ResidentId == body.ResidentId))
            return NotFound(new { message = "Resident not found." });

        if (body.SafehouseId <= 0)
            errors["safehouse_id"] = "Required";
        else if (!await _beaconContext.Safehouses.AsNoTracking().AnyAsync(s => s.SafehouseId == body.SafehouseId))
            errors["safehouse_id"] = "Safehouse not found.";

        if (body.IncidentDate == default)
            errors["incident_date"] = "Required";

        if (errors.Count > 0)
            return BadRequest(new { message = "Please complete all required fields.", errors });

        var incidentId = await _beaconContext.AllocateNextIncidentReportIdAsync();
        var entity = new IncidentReport
        {
            IncidentId = incidentId,
            ResidentId = body.ResidentId,
            SafehouseId = body.SafehouseId,
            IncidentDate = body.IncidentDate,
            IncidentType = NullIfWhiteSpace(body.IncidentType),
            Severity = NullIfWhiteSpace(body.Severity),
            Description = NullIfWhiteSpace(body.Description),
            ResponseTaken = NullIfWhiteSpace(body.ResponseTaken),
            Resolved = body.Resolved,
            ResolutionDate = body.ResolutionDate,
            ReportedBy = NullIfWhiteSpace(body.ReportedBy),
            FollowUpRequired = body.FollowUpRequired,
        };
        _beaconContext.Set<IncidentReport>().Add(entity);
        await _beaconContext.SaveChangesAsync();
        return StatusCode(StatusCodes.Status201Created,
            new CreateIncidentReportResult { IncidentId = entity.IncidentId });
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPut("EducationRecord/{educationRecordId:int}")]
    public async Task<IActionResult> UpdateEducationRecord(
        int educationRecordId,
        [FromBody] CreateEducationRecordRequest? body)
    {
        if (body == null)
            return BadRequest(new { message = "Invalid request body.", errors = (object?)null });

        var entity = await _beaconContext.Set<EducationRecord>()
            .FirstOrDefaultAsync(e => e.EducationRecordId == educationRecordId);
        if (entity == null)
            return NotFound(new { message = "Education record not found." });
        if (entity.ResidentId != body.ResidentId)
        {
            return BadRequest(new
            {
                message = "This record belongs to another resident.",
                errors = new Dictionary<string, string> { ["resident_id"] = "Does not match this record." },
            });
        }

        var errors = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        if (body.ResidentId <= 0)
            errors["resident_id"] = "Required";
        var residentExists = body.ResidentId > 0 &&
                             await _beaconContext.Residents.AsNoTracking()
                                 .AnyAsync(r => r.ResidentId == body.ResidentId);
        if (body.ResidentId > 0 && !residentExists)
            return NotFound(new { message = "Resident not found." });

        if (body.RecordDate == default)
            errors["record_date"] = "Required";

        if (string.IsNullOrWhiteSpace(body.SchoolName))
            errors["school_name"] = "Required";

        var enrollment = (body.EnrollmentStatus ?? "").Trim();
        if (enrollment is not ("Enrolled" or "Not Enrolled"))
            errors["enrollment_status"] = "Choose Enrolled or Not Enrolled.";

        var completion = (body.CompletionStatus ?? "").Trim();
        if (completion is not ("NotStarted" or "InProgress"))
            errors["completion_status"] = "Choose Not Started or In Progress.";

        if (body.AttendanceRate is null)
            errors["attendance_rate"] = "Required";
        else
        {
            var att = Math.Round(body.AttendanceRate.Value, 3, MidpointRounding.AwayFromZero);
            if (att < 0m || att > 1m)
                errors["attendance_rate"] = "Must be between 0 and 1.";
        }

        if (body.ProgressPercent is null)
            errors["progress_percent"] = "Required";
        else
        {
            var prog = Math.Round(body.ProgressPercent.Value, 1, MidpointRounding.AwayFromZero);
            if (prog < 0m || prog > 100m)
                errors["progress_percent"] = "Must be between 0 and 100.";
        }

        if (errors.Count > 0)
            return BadRequest(new { message = "Please complete all required fields.", errors });

        var attendanceRounded = Math.Round(body.AttendanceRate!.Value, 3, MidpointRounding.AwayFromZero);
        var progressRounded = Math.Round(body.ProgressPercent!.Value, 1, MidpointRounding.AwayFromZero);

        entity.RecordDate = body.RecordDate;
        entity.SchoolName = body.SchoolName.Trim();
        entity.EnrollmentStatus = enrollment;
        entity.AttendanceRate = attendanceRounded;
        entity.ProgressPercent = progressRounded;
        entity.CompletionStatus = completion;
        entity.Notes = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes.Trim();

        var save = await TrySaveResidentRecordUpdateAsync(nameof(UpdateEducationRecord));
        if (save != null) return save;
        return Ok(new CreateEducationRecordResult { EducationRecordId = entity.EducationRecordId });
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPut("HealthWellbeingRecord/{healthRecordId:int}")]
    public async Task<IActionResult> UpdateHealthWellbeingRecord(
        int healthRecordId,
        [FromBody] CreateHealthWellbeingRecordRequest? body)
    {
        if (body == null)
            return BadRequest(new { message = "Invalid request body.", errors = (object?)null });

        var entity = await _beaconContext.Set<HealthWellbeingRecord>()
            .FirstOrDefaultAsync(h => h.HealthRecordId == healthRecordId);
        if (entity == null)
            return NotFound(new { message = "Health record not found." });
        if (entity.ResidentId != body.ResidentId)
        {
            return BadRequest(new
            {
                message = "This record belongs to another resident.",
                errors = new Dictionary<string, string> { ["resident_id"] = "Does not match this record." },
            });
        }

        var errors = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (body.ResidentId <= 0)
            errors["resident_id"] = "Required";
        else if (!await _beaconContext.Residents.AsNoTracking().AnyAsync(x => x.ResidentId == body.ResidentId))
            return NotFound(new { message = "Resident not found." });

        if (body.RecordDate == default)
            errors["record_date"] = "Required";

        AddHealthScore0To5(errors, body.GeneralHealthScore, "general_health_score");
        AddHealthScore0To5(errors, body.NutritionScore, "nutrition_score");
        AddHealthScore0To5(errors, body.SleepQualityScore, "sleep_quality_score");
        AddHealthScore0To5(errors, body.EnergyLevelScore, "energy_level_score");

        if (errors.Count > 0)
            return BadRequest(new { message = "Please complete all required fields.", errors });

        entity.RecordDate = body.RecordDate;
        entity.GeneralHealthScore = body.GeneralHealthScore;
        entity.NutritionScore = body.NutritionScore;
        entity.SleepQualityScore = body.SleepQualityScore;
        entity.EnergyLevelScore = body.EnergyLevelScore;
        entity.HeightCm = body.HeightCm;
        entity.WeightKg = body.WeightKg;
        entity.Bmi = body.Bmi;
        entity.MedicalCheckupDone = body.MedicalCheckupDone;
        entity.DentalCheckupDone = body.DentalCheckupDone;
        entity.PsychologicalCheckupDone = body.PsychologicalCheckupDone;
        entity.Notes = NullIfWhiteSpace(body.Notes);

        var save = await TrySaveResidentRecordUpdateAsync(nameof(UpdateHealthWellbeingRecord));
        if (save != null) return save;
        return Ok(new CreateHealthWellbeingRecordResult { HealthRecordId = entity.HealthRecordId });
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPut("ProcessRecording/{recordingId:int}")]
    public async Task<IActionResult> UpdateProcessRecording(
        int recordingId,
        [FromBody] CreateProcessRecordingRequest? body)
    {
        if (body == null)
            return BadRequest(new { message = "Invalid request body.", errors = (object?)null });

        var entity = await _beaconContext.Set<ProcessRecording>()
            .FirstOrDefaultAsync(p => p.RecordingId == recordingId);
        if (entity == null)
            return NotFound(new { message = "Process recording not found." });
        if (entity.ResidentId != body.ResidentId)
        {
            return BadRequest(new
            {
                message = "This record belongs to another resident.",
                errors = new Dictionary<string, string> { ["resident_id"] = "Does not match this record." },
            });
        }

        var errors = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (body.ResidentId <= 0)
            errors["resident_id"] = "Required";
        else if (!await _beaconContext.Residents.AsNoTracking().AnyAsync(x => x.ResidentId == body.ResidentId))
            return NotFound(new { message = "Resident not found." });

        if (body.SessionDate == default)
            errors["session_date"] = "Required";

        if (body.SessionDurationMinutes is < 0)
            errors["session_duration_minutes"] = "Must be zero or greater.";

        if (errors.Count > 0)
            return BadRequest(new { message = "Please complete all required fields.", errors });

        entity.SessionDate = body.SessionDate;
        entity.SocialWorker = NullIfWhiteSpace(body.SocialWorker);
        entity.SessionType = NullIfWhiteSpace(body.SessionType);
        entity.SessionDurationMinutes = body.SessionDurationMinutes;
        entity.EmotionalStateObserved = NullIfWhiteSpace(body.EmotionalStateObserved);
        entity.EmotionalStateEnd = NullIfWhiteSpace(body.EmotionalStateEnd);
        entity.SessionNarrative = NullIfWhiteSpace(body.SessionNarrative);
        entity.InterventionsApplied = NullIfWhiteSpace(body.InterventionsApplied);
        entity.FollowUpActions = NullIfWhiteSpace(body.FollowUpActions);
        entity.ProgressNoted = body.ProgressNoted;
        entity.ConcernsFlagged = body.ConcernsFlagged;
        entity.ReferralMade = body.ReferralMade;
        entity.NotesRestricted = NullIfWhiteSpace(body.NotesRestricted);

        var save = await TrySaveResidentRecordUpdateAsync(nameof(UpdateProcessRecording));
        if (save != null) return save;
        return Ok(new CreateProcessRecordingResult { RecordingId = entity.RecordingId });
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPut("HomeVisitation/{visitationId:int}")]
    public async Task<IActionResult> UpdateHomeVisitation(
        int visitationId,
        [FromBody] CreateHomeVisitationRequest? body)
    {
        if (body == null)
            return BadRequest(new { message = "Invalid request body.", errors = (object?)null });

        var entity = await _beaconContext.Set<HomeVisitation>()
            .FirstOrDefaultAsync(v => v.VisitationId == visitationId);
        if (entity == null)
            return NotFound(new { message = "Home visit not found." });
        if (entity.ResidentId != body.ResidentId)
        {
            return BadRequest(new
            {
                message = "This record belongs to another resident.",
                errors = new Dictionary<string, string> { ["resident_id"] = "Does not match this record." },
            });
        }

        var errors = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (body.ResidentId <= 0)
            errors["resident_id"] = "Required";
        else if (!await _beaconContext.Residents.AsNoTracking().AnyAsync(x => x.ResidentId == body.ResidentId))
            return NotFound(new { message = "Resident not found." });

        if (body.VisitDate == default)
            errors["visit_date"] = "Required";

        if (errors.Count > 0)
            return BadRequest(new { message = "Please complete all required fields.", errors });

        entity.VisitDate = body.VisitDate;
        entity.SocialWorker = NullIfWhiteSpace(body.SocialWorker);
        entity.VisitType = NullIfWhiteSpace(body.VisitType);
        entity.LocationVisited = NullIfWhiteSpace(body.LocationVisited);
        entity.FamilyMembersPresent = NullIfWhiteSpace(body.FamilyMembersPresent);
        entity.Purpose = NullIfWhiteSpace(body.Purpose);
        entity.Observations = NullIfWhiteSpace(body.Observations);
        entity.FamilyCooperationLevel = NullIfWhiteSpace(body.FamilyCooperationLevel);
        entity.SafetyConcernsNoted = body.SafetyConcernsNoted;
        entity.FollowUpNeeded = body.FollowUpNeeded;
        entity.FollowUpNotes = NullIfWhiteSpace(body.FollowUpNotes);
        entity.VisitOutcome = NullIfWhiteSpace(body.VisitOutcome);

        var save = await TrySaveResidentRecordUpdateAsync(nameof(UpdateHomeVisitation));
        if (save != null) return save;
        return Ok(new CreateHomeVisitationResult { VisitationId = entity.VisitationId });
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPut("IncidentReport/{incidentId:int}")]
    public async Task<IActionResult> UpdateIncidentReport(
        int incidentId,
        [FromBody] CreateIncidentReportRequest? body)
    {
        if (body == null)
            return BadRequest(new { message = "Invalid request body.", errors = (object?)null });

        var entity = await _beaconContext.Set<IncidentReport>()
            .FirstOrDefaultAsync(i => i.IncidentId == incidentId);
        if (entity == null)
            return NotFound(new { message = "Incident report not found." });
        if (entity.ResidentId != body.ResidentId)
        {
            return BadRequest(new
            {
                message = "This record belongs to another resident.",
                errors = new Dictionary<string, string> { ["resident_id"] = "Does not match this record." },
            });
        }

        var errors = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (body.ResidentId <= 0)
            errors["resident_id"] = "Required";
        else if (!await _beaconContext.Residents.AsNoTracking().AnyAsync(x => x.ResidentId == body.ResidentId))
            return NotFound(new { message = "Resident not found." });

        if (body.SafehouseId <= 0)
            errors["safehouse_id"] = "Required";
        else if (!await _beaconContext.Safehouses.AsNoTracking().AnyAsync(s => s.SafehouseId == body.SafehouseId))
            errors["safehouse_id"] = "Safehouse not found.";

        if (body.IncidentDate == default)
            errors["incident_date"] = "Required";

        if (errors.Count > 0)
            return BadRequest(new { message = "Please complete all required fields.", errors });

        entity.SafehouseId = body.SafehouseId;
        entity.IncidentDate = body.IncidentDate;
        entity.IncidentType = NullIfWhiteSpace(body.IncidentType);
        entity.Severity = NullIfWhiteSpace(body.Severity);
        entity.Description = NullIfWhiteSpace(body.Description);
        entity.ResponseTaken = NullIfWhiteSpace(body.ResponseTaken);
        entity.Resolved = body.Resolved;
        entity.ResolutionDate = body.ResolutionDate;
        entity.ReportedBy = NullIfWhiteSpace(body.ReportedBy);
        entity.FollowUpRequired = body.FollowUpRequired;

        var save = await TrySaveResidentRecordUpdateAsync(nameof(UpdateIncidentReport));
        if (save != null) return save;
        return Ok(new CreateIncidentReportResult { IncidentId = entity.IncidentId });
    }

    /// <summary>POST aliases for SPA updates: some edge/proxy setups return 404 for PUT; POST is universally routed.</summary>
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPost("EducationRecord/{educationRecordId:int}/Update")]
    public Task<IActionResult> PostUpdateEducationRecord(int educationRecordId, [FromBody] CreateEducationRecordRequest? body)
        => UpdateEducationRecord(educationRecordId, body);

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPost("HealthWellbeingRecord/{healthRecordId:int}/Update")]
    public Task<IActionResult> PostUpdateHealthWellbeingRecord(int healthRecordId, [FromBody] CreateHealthWellbeingRecordRequest? body)
        => UpdateHealthWellbeingRecord(healthRecordId, body);

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPost("ProcessRecording/{recordingId:int}/Update")]
    public Task<IActionResult> PostUpdateProcessRecording(int recordingId, [FromBody] CreateProcessRecordingRequest? body)
        => UpdateProcessRecording(recordingId, body);

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPost("HomeVisitation/{visitationId:int}/Update")]
    public Task<IActionResult> PostUpdateHomeVisitation(int visitationId, [FromBody] CreateHomeVisitationRequest? body)
        => UpdateHomeVisitation(visitationId, body);

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPost("IncidentReport/{incidentId:int}/Update")]
    public Task<IActionResult> PostUpdateIncidentReport(int incidentId, [FromBody] CreateIncidentReportRequest? body)
        => UpdateIncidentReport(incidentId, body);

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPost("EducationRecord/{educationRecordId:int}/Delete")]
    public async Task<IActionResult> PostDeleteEducationRecord(
        int educationRecordId,
        [FromBody] DeleteResidentRecordRequest? body)
    {
        if (body == null || body.ResidentId <= 0)
            return BadRequest(new
            {
                message = "resident_id is required.",
                errors = new Dictionary<string, string> { ["resident_id"] = "Required" },
            });

        var entity = await _beaconContext.Set<EducationRecord>()
            .FirstOrDefaultAsync(e => e.EducationRecordId == educationRecordId);
        if (entity == null)
            return NotFound(new { message = "Education record not found." });
        if (entity.ResidentId != body.ResidentId)
        {
            return BadRequest(new
            {
                message = "This record belongs to another resident.",
                errors = new Dictionary<string, string> { ["resident_id"] = "Does not match this record." },
            });
        }

        _beaconContext.Set<EducationRecord>().Remove(entity);
        var save = await TrySaveResidentRecordUpdateAsync(nameof(PostDeleteEducationRecord));
        if (save != null) return save;
        return NoContent();
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPost("HealthWellbeingRecord/{healthRecordId:int}/Delete")]
    public async Task<IActionResult> PostDeleteHealthWellbeingRecord(
        int healthRecordId,
        [FromBody] DeleteResidentRecordRequest? body)
    {
        if (body == null || body.ResidentId <= 0)
            return BadRequest(new
            {
                message = "resident_id is required.",
                errors = new Dictionary<string, string> { ["resident_id"] = "Required" },
            });

        var entity = await _beaconContext.Set<HealthWellbeingRecord>()
            .FirstOrDefaultAsync(h => h.HealthRecordId == healthRecordId);
        if (entity == null)
            return NotFound(new { message = "Health record not found." });
        if (entity.ResidentId != body.ResidentId)
        {
            return BadRequest(new
            {
                message = "This record belongs to another resident.",
                errors = new Dictionary<string, string> { ["resident_id"] = "Does not match this record." },
            });
        }

        _beaconContext.Set<HealthWellbeingRecord>().Remove(entity);
        var save = await TrySaveResidentRecordUpdateAsync(nameof(PostDeleteHealthWellbeingRecord));
        if (save != null) return save;
        return NoContent();
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPost("ProcessRecording/{recordingId:int}/Delete")]
    public async Task<IActionResult> PostDeleteProcessRecording(
        int recordingId,
        [FromBody] DeleteResidentRecordRequest? body)
    {
        if (body == null || body.ResidentId <= 0)
            return BadRequest(new
            {
                message = "resident_id is required.",
                errors = new Dictionary<string, string> { ["resident_id"] = "Required" },
            });

        var entity = await _beaconContext.Set<ProcessRecording>()
            .FirstOrDefaultAsync(p => p.RecordingId == recordingId);
        if (entity == null)
            return NotFound(new { message = "Process recording not found." });
        if (entity.ResidentId != body.ResidentId)
        {
            return BadRequest(new
            {
                message = "This record belongs to another resident.",
                errors = new Dictionary<string, string> { ["resident_id"] = "Does not match this record." },
            });
        }

        _beaconContext.Set<ProcessRecording>().Remove(entity);
        var save = await TrySaveResidentRecordUpdateAsync(nameof(PostDeleteProcessRecording));
        if (save != null) return save;
        return NoContent();
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPost("HomeVisitation/{visitationId:int}/Delete")]
    public async Task<IActionResult> PostDeleteHomeVisitation(
        int visitationId,
        [FromBody] DeleteResidentRecordRequest? body)
    {
        if (body == null || body.ResidentId <= 0)
            return BadRequest(new
            {
                message = "resident_id is required.",
                errors = new Dictionary<string, string> { ["resident_id"] = "Required" },
            });

        var entity = await _beaconContext.Set<HomeVisitation>()
            .FirstOrDefaultAsync(v => v.VisitationId == visitationId);
        if (entity == null)
            return NotFound(new { message = "Home visit not found." });
        if (entity.ResidentId != body.ResidentId)
        {
            return BadRequest(new
            {
                message = "This record belongs to another resident.",
                errors = new Dictionary<string, string> { ["resident_id"] = "Does not match this record." },
            });
        }

        _beaconContext.Set<HomeVisitation>().Remove(entity);
        var save = await TrySaveResidentRecordUpdateAsync(nameof(PostDeleteHomeVisitation));
        if (save != null) return save;
        return NoContent();
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpPost("IncidentReport/{incidentId:int}/Delete")]
    public async Task<IActionResult> PostDeleteIncidentReport(
        int incidentId,
        [FromBody] DeleteResidentRecordRequest? body)
    {
        if (body == null || body.ResidentId <= 0)
            return BadRequest(new
            {
                message = "resident_id is required.",
                errors = new Dictionary<string, string> { ["resident_id"] = "Required" },
            });

        var entity = await _beaconContext.Set<IncidentReport>()
            .FirstOrDefaultAsync(i => i.IncidentId == incidentId);
        if (entity == null)
            return NotFound(new { message = "Incident report not found." });
        if (entity.ResidentId != body.ResidentId)
        {
            return BadRequest(new
            {
                message = "This record belongs to another resident.",
                errors = new Dictionary<string, string> { ["resident_id"] = "Does not match this record." },
            });
        }

        _beaconContext.Set<IncidentReport>().Remove(entity);
        var save = await TrySaveResidentRecordUpdateAsync(nameof(PostDeleteIncidentReport));
        if (save != null) return save;
        return NoContent();
    }

    private async Task<IActionResult?> TrySaveResidentRecordUpdateAsync(string operationLabel)
    {
        try
        {
            await _beaconContext.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "{Operation}: database update failed", operationLabel);
            return Problem(
                title: "Could not save the record",
                detail: "The database rejected this update. Check logs and migrations.",
                statusCode: StatusCodes.Status409Conflict);
        }

        return null;
    }

    private static string? NullIfWhiteSpace(string? s) =>
        string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    private static List<string> MergeDistinctStrings(IEnumerable<string> fromDb, IEnumerable<string> defaults) =>
        fromDb.Concat(defaults).Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(s => s, StringComparer.OrdinalIgnoreCase).ToList();

    private static void AddHealthScore0To5(Dictionary<string, string> errors, decimal? val, string key)
    {
        if (val is null) return;
        if (val < 0m || val > 5m)
            errors[key] = "Must be a number between 0 and 5.";
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
