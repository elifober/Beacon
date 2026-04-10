namespace Beacon.API.Models;

/// <summary>
/// Admin-only create body for <c>residents</c>. Uses a flat DTO so JSON model binding does not need to
/// materialize the full <see cref="Resident"/> entity graph (navigation properties / collections).
/// </summary>
public sealed class AdminCreateResidentRequest
{
    public string? CaseControlNo { get; set; }

    public string? InternalCode { get; set; }

    public int SafehouseId { get; set; }

    public string? CaseStatus { get; set; }

    public string? Sex { get; set; }

    /// <summary>ISO calendar date (yyyy-MM-dd), empty, or null — not a full DateTime string required.</summary>
    public string? DateOfBirth { get; set; }

    public string? InitialRiskLevel { get; set; }

    public string? CurrentRiskLevel { get; set; }
}

/// <summary>Admin-only create body for <c>partners</c>; PK is database-generated.</summary>
public sealed class AdminCreatePartnerRequest
{
    public string PartnerName { get; set; } = string.Empty;

    public string? PartnerType { get; set; }

    public string? RoleType { get; set; }

    public string? ContactName { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public string? Region { get; set; }

    public string? Status { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public string? Notes { get; set; }
}

/// <summary>Admin-only create body for <c>safehouses</c>; PK is database-generated.</summary>
public sealed class AdminCreateSafehouseRequest
{
    public string SafehouseCode { get; set; } = string.Empty;

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

    public string? Notes { get; set; }
}

/// <summary>Admin-only create body for <c>supporters</c> (donors); PK is allocated in application code.</summary>
public sealed class AdminCreateSupporterRequest
{
    public string? SupporterType { get; set; }

    public string? DisplayName { get; set; }

    public string? OrganizationName { get; set; }

    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    public string? RelationshipType { get; set; }

    public string? Region { get; set; }

    public string? Country { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public string? Status { get; set; }

    public DateOnly? FirstDonationDate { get; set; }

    public string? AcquisitionChannel { get; set; }
}
