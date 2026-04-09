using System.Text.Json.Serialization;

namespace Beacon.API.Models;

public sealed class ProcessRecordingPicklistsResponse
{
    [JsonPropertyName("session_types")]
    public List<string> SessionTypes { get; init; } = [];

    [JsonPropertyName("emotional_states_observed")]
    public List<string> EmotionalStatesObserved { get; init; } = [];

    [JsonPropertyName("emotional_states_end")]
    public List<string> EmotionalStatesEnd { get; init; } = [];
}

public sealed class HomeVisitationPicklistsResponse
{
    [JsonPropertyName("visit_types")]
    public List<string> VisitTypes { get; init; } = [];

    [JsonPropertyName("family_cooperation_levels")]
    public List<string> FamilyCooperationLevels { get; init; } = [];

    [JsonPropertyName("visit_outcomes")]
    public List<string> VisitOutcomes { get; init; } = [];
}

public sealed class IncidentReportPicklistsResponse
{
    [JsonPropertyName("incident_types")]
    public List<string> IncidentTypes { get; init; } = [];

    [JsonPropertyName("severities")]
    public List<string> Severities { get; init; } = [];
}
