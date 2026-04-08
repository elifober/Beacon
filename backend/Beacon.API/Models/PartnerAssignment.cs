using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Beacon.API.Models;

public partial class PartnerAssignment
{
    [Key]
    public int AssignmentId { get; set; }

    public int PartnerId { get; set; }

    public int? SafehouseId { get; set; }

    public string? ProgramArea { get; set; }

    public DateOnly? AssignmentStart { get; set; }

    public DateOnly? AssignmentEnd { get; set; }

    public string? ResponsibilityNotes { get; set; }

    public bool? IsPrimary { get; set; }

    public string? Status { get; set; }

    public virtual Partner Partner { get; set; } = null!;

    public virtual Safehouse? Safehouse { get; set; }
}
