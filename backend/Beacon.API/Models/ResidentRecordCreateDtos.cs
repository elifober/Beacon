using System.Text.Json.Serialization;

namespace Beacon.API.Models;

public sealed class CreateHealthWellbeingRecordRequest
{
    [JsonPropertyName("resident_id")]
    public int ResidentId { get; set; }

    [JsonPropertyName("record_date")]
    public DateOnly RecordDate { get; set; }

    [JsonPropertyName("general_health_score")]
    public decimal? GeneralHealthScore { get; set; }

    [JsonPropertyName("nutrition_score")]
    public decimal? NutritionScore { get; set; }

    [JsonPropertyName("sleep_quality_score")]
    public decimal? SleepQualityScore { get; set; }

    [JsonPropertyName("energy_level_score")]
    public decimal? EnergyLevelScore { get; set; }

    [JsonPropertyName("height_cm")]
    public decimal? HeightCm { get; set; }

    [JsonPropertyName("weight_kg")]
    public decimal? WeightKg { get; set; }

    [JsonPropertyName("bmi")]
    public decimal? Bmi { get; set; }

    [JsonPropertyName("medical_checkup_done")]
    public bool? MedicalCheckupDone { get; set; }

    [JsonPropertyName("dental_checkup_done")]
    public bool? DentalCheckupDone { get; set; }

    [JsonPropertyName("psychological_checkup_done")]
    public bool? PsychologicalCheckupDone { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }
}

public sealed class CreateHealthWellbeingRecordResult
{
    [JsonPropertyName("health_record_id")]
    public int HealthRecordId { get; init; }
}

public sealed class CreateProcessRecordingRequest
{
    [JsonPropertyName("resident_id")]
    public int ResidentId { get; set; }

    [JsonPropertyName("session_date")]
    public DateOnly SessionDate { get; set; }

    [JsonPropertyName("social_worker")]
    public string? SocialWorker { get; set; }

    [JsonPropertyName("session_type")]
    public string? SessionType { get; set; }

    [JsonPropertyName("session_duration_minutes")]
    public int? SessionDurationMinutes { get; set; }

    [JsonPropertyName("emotional_state_observed")]
    public string? EmotionalStateObserved { get; set; }

    [JsonPropertyName("emotional_state_end")]
    public string? EmotionalStateEnd { get; set; }

    [JsonPropertyName("session_narrative")]
    public string? SessionNarrative { get; set; }

    [JsonPropertyName("interventions_applied")]
    public string? InterventionsApplied { get; set; }

    [JsonPropertyName("follow_up_actions")]
    public string? FollowUpActions { get; set; }

    [JsonPropertyName("progress_noted")]
    public bool? ProgressNoted { get; set; }

    [JsonPropertyName("concerns_flagged")]
    public bool? ConcernsFlagged { get; set; }

    [JsonPropertyName("referral_made")]
    public bool? ReferralMade { get; set; }

    [JsonPropertyName("notes_restricted")]
    public string? NotesRestricted { get; set; }
}

public sealed class CreateProcessRecordingResult
{
    [JsonPropertyName("recording_id")]
    public int RecordingId { get; init; }
}

public sealed class CreateHomeVisitationRequest
{
    [JsonPropertyName("resident_id")]
    public int ResidentId { get; set; }

    [JsonPropertyName("visit_date")]
    public DateOnly VisitDate { get; set; }

    [JsonPropertyName("social_worker")]
    public string? SocialWorker { get; set; }

    [JsonPropertyName("visit_type")]
    public string? VisitType { get; set; }

    [JsonPropertyName("location_visited")]
    public string? LocationVisited { get; set; }

    [JsonPropertyName("family_members_present")]
    public string? FamilyMembersPresent { get; set; }

    [JsonPropertyName("purpose")]
    public string? Purpose { get; set; }

    [JsonPropertyName("observations")]
    public string? Observations { get; set; }

    [JsonPropertyName("family_cooperation_level")]
    public string? FamilyCooperationLevel { get; set; }

    [JsonPropertyName("safety_concerns_noted")]
    public bool? SafetyConcernsNoted { get; set; }

    [JsonPropertyName("follow_up_needed")]
    public bool? FollowUpNeeded { get; set; }

    [JsonPropertyName("follow_up_notes")]
    public string? FollowUpNotes { get; set; }

    [JsonPropertyName("visit_outcome")]
    public string? VisitOutcome { get; set; }
}

public sealed class CreateHomeVisitationResult
{
    [JsonPropertyName("visitation_id")]
    public int VisitationId { get; init; }
}

public sealed class CreateIncidentReportRequest
{
    [JsonPropertyName("resident_id")]
    public int ResidentId { get; set; }

    [JsonPropertyName("safehouse_id")]
    public int SafehouseId { get; set; }

    [JsonPropertyName("incident_date")]
    public DateOnly IncidentDate { get; set; }

    [JsonPropertyName("incident_type")]
    public string? IncidentType { get; set; }

    [JsonPropertyName("severity")]
    public string? Severity { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("response_taken")]
    public string? ResponseTaken { get; set; }

    [JsonPropertyName("resolved")]
    public bool? Resolved { get; set; }

    [JsonPropertyName("resolution_date")]
    public DateOnly? ResolutionDate { get; set; }

    [JsonPropertyName("reported_by")]
    public string? ReportedBy { get; set; }

    [JsonPropertyName("follow_up_required")]
    public bool? FollowUpRequired { get; set; }
}

public sealed class CreateIncidentReportResult
{
    [JsonPropertyName("incident_id")]
    public int IncidentId { get; init; }
}
