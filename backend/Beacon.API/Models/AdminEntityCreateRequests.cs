namespace Beacon.API.Models;

/// <summary>
/// Admin-only create body for <c>residents</c>. Uses a flat DTO so JSON model binding does not need to
/// materialize the full <see cref="Resident"/> entity graph (navigation properties / collections).
/// </summary>
public sealed class AdminCreateResidentRequest
{
    public string? FirstName { get; set; }

    public string? LastInitial { get; set; }

    public string? Religion { get; set; }

    public string? CaseControlNo { get; set; }

    public string? InternalCode { get; set; }

    public int SafehouseId { get; set; }

    public string? CaseStatus { get; set; }

    public string? Sex { get; set; }

    /// <summary>ISO calendar date (yyyy-MM-dd), empty, or null — not a full DateTime string required.</summary>
    public string? DateOfBirth { get; set; }

    /// <summary>ISO calendar date (yyyy-MM-dd).</summary>
    public string? DateOfAdmission { get; set; }

    public string? CaseCategory { get; set; }

    public string? InitialRiskLevel { get; set; }

    /// <summary>
    /// On <strong>create</strong>, the API sets current risk from initial risk (client value ignored).
    /// On update, this value is persisted.
    /// </summary>
    public string? CurrentRiskLevel { get; set; }

    public string? BirthStatus { get; set; }

    public string? PlaceOfBirth { get; set; }

    public bool? FamilyIs4ps { get; set; }

    public bool? FamilySoloParent { get; set; }

    public bool? FamilyIndigenous { get; set; }

    public bool? FamilyParentPwd { get; set; }

    public bool? SubCatOrphaned { get; set; }

    public bool? SubCatTrafficked { get; set; }

    public bool? SubCatChildLabor { get; set; }

    public bool? SubCatPhysicalAbuse { get; set; }

    public bool? SubCatSexualAbuse { get; set; }

    public bool? SubCatOsaec { get; set; }

    public bool? SubCatCicl { get; set; }

    public bool? SubCatAtRisk { get; set; }

    public bool? SubCatStreetChild { get; set; }

    public bool? SubCatChildWithHiv { get; set; }

    public bool? IsPwd { get; set; }

    public string? PwdType { get; set; }

    public bool? HasSpecialNeeds { get; set; }

    public string? SpecialNeedsDiagnosis { get; set; }
}

/// <summary>Admin-only create body for <c>partners</c>; PK is database-generated.</summary>
public sealed class AdminCreatePartnerRequest
{
    public string PartnerName { get; set; } = string.Empty;

    public string? PartnerType { get; set; }

    public string? RoleType { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public string? Region { get; set; }

    public string? Status { get; set; }

    public DateOnly? StartDate { get; set; }

    public string? Notes { get; set; }
}

/// <summary>Admin-only create body for <c>safehouses</c>; PK is database-generated.</summary>
public sealed class AdminCreateSafehouseRequest
{
    public string Name { get; set; } = string.Empty;

    public string? Region { get; set; }

    public string? City { get; set; }

    public string? Province { get; set; }

    public string? Country { get; set; }

    public DateOnly? OpenDate { get; set; }

    public string? Status { get; set; }

    public int? CapacityGirls { get; set; }

    public int? CapacityStaff { get; set; }

    public int? CurrentOccupancy { get; set; }
}

/// <summary>Admin-only create body for <c>supporters</c> (donors); PK is allocated in application code.</summary>
public sealed class AdminCreateSupporterRequest
{
    public string? SupporterType { get; set; }

    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    public string? RelationshipType { get; set; }

    public string? Region { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public string? Status { get; set; }

    public string? AcquisitionChannel { get; set; }
}
