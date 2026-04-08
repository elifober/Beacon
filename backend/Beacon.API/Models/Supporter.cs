using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using Beacon.API.Data;

namespace Beacon.API.Models;

public partial class Supporter
{
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int SupporterId { get; set; }

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

    public DateTime? CreatedAt { get; set; }

    public DateOnly? FirstDonationDate { get; set; }

    public string? AcquisitionChannel { get; set; }

    public virtual ICollection<Donation> Donations { get; set; } = new List<Donation>();
    

    public string? IdentityUserId { get; set; }
    public virtual ApplicationUser? IdentityUser { get; set; }
}
