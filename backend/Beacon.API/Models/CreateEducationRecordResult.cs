using System.Text.Json.Serialization;

namespace Beacon.API.Models;

public sealed class CreateEducationRecordResult
{
    [JsonPropertyName("education_record_id")]
    public int EducationRecordId { get; init; }
}
