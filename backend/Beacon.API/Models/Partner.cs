using System;
using System.Collections.Generic;
using Beacon.API.Data;

namespace Beacon.API.Models;

public partial class Partner
{
    public int PartnerId { get; set; }

    public string PartnerName { get; set; } = null!;

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

    public virtual ICollection<PartnerAssignment> PartnerAssignments { get; set; } = new List<PartnerAssignment>();
    // Add this to Partner.cs
    public string? IdentityUserId { get; set; }
    public virtual ApplicationUser? IdentityUser { get; set; }
}
