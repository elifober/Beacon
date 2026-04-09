namespace Beacon.API.Models;

/// <summary>
/// Strongly typed rows for GET Resident/{id} JSON (avoids System.Text.Json issues with List&lt;anonymous&gt; boxed as object).
/// </summary>
public sealed class ResidentEducationRecordRow
{
    public int EducationRecordId { get; set; }
    public DateOnly RecordDate { get; set; }
    public string? EducationLevel { get; set; }
    public string? SchoolName { get; set; }
    public string? EnrollmentStatus { get; set; }
    public decimal? AttendanceRate { get; set; }
    public decimal? ProgressPercent { get; set; }
    public string? CompletionStatus { get; set; }
    public string? Notes { get; set; }
}

public sealed class ResidentHealthWellbeingRecordRow
{
    public int HealthRecordId { get; set; }
    public DateOnly RecordDate { get; set; }
    public decimal? GeneralHealthScore { get; set; }
    public decimal? NutritionScore { get; set; }
    public decimal? SleepQualityScore { get; set; }
    public decimal? EnergyLevelScore { get; set; }
    public decimal? HeightCm { get; set; }
    public decimal? WeightKg { get; set; }
    public decimal? Bmi { get; set; }
    public bool? MedicalCheckupDone { get; set; }
    public bool? DentalCheckupDone { get; set; }
    public bool? PsychologicalCheckupDone { get; set; }
    public string? Notes { get; set; }
}

public sealed class ResidentProcessRecordingRow
{
    public int RecordingId { get; set; }
    public DateOnly SessionDate { get; set; }
    public string? SocialWorker { get; set; }
    public string? SessionType { get; set; }
    public int? SessionDurationMinutes { get; set; }
    public string? EmotionalStateObserved { get; set; }
    public string? EmotionalStateEnd { get; set; }
    public string? InterventionsApplied { get; set; }
    public string? FollowUpActions { get; set; }
    public bool? ProgressNoted { get; set; }
    public bool? ConcernsFlagged { get; set; }
    public bool? ReferralMade { get; set; }
    public string? SessionNarrative { get; set; }
    public string? NotesRestricted { get; set; }
}

public sealed class ResidentHomeVisitationRow
{
    public int VisitationId { get; set; }
    public DateOnly VisitDate { get; set; }
    public string? SocialWorker { get; set; }
    public string? VisitType { get; set; }
    public string? LocationVisited { get; set; }
    public string? FamilyMembersPresent { get; set; }
    public string? Purpose { get; set; }
    public string? Observations { get; set; }
    public string? FamilyCooperationLevel { get; set; }
    public bool? SafetyConcernsNoted { get; set; }
    public bool? FollowUpNeeded { get; set; }
    public string? FollowUpNotes { get; set; }
    public string? VisitOutcome { get; set; }
}

public sealed class ResidentIncidentReportRow
{
    public int IncidentId { get; set; }
    public int SafehouseId { get; set; }
    public DateOnly IncidentDate { get; set; }
    public string? IncidentType { get; set; }
    public string? Severity { get; set; }
    public string? Description { get; set; }
    public string? ResponseTaken { get; set; }
    public bool? Resolved { get; set; }
    public DateOnly? ResolutionDate { get; set; }
    public string? ReportedBy { get; set; }
    public bool? FollowUpRequired { get; set; }
    public string? SafehouseCity { get; set; }
}

/// <summary>Partners assigned to the resident&apos;s safehouse (active assignments) for admin contact.</summary>
public sealed class ResidentSafehousePartnerRow
{
    public int PartnerId { get; set; }
    public string PartnerName { get; set; } = "";
    public string? ContactName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? ProgramArea { get; set; }
    public bool? IsPrimary { get; set; }
    public string? AssignmentStatus { get; set; }
}
