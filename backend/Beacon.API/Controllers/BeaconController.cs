using Beacon.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Beacon.API.Data;
using Microsoft.EntityFrameworkCore;

namespace Beacon.API.Controllers;

[Route("[controller]")]
[ApiController]

public class BeaconController : ControllerBase
{
    private PostgresContext _beaconContext;

    public BeaconController(PostgresContext temp) => _beaconContext = temp;

    [HttpGet("AllResidents")]
    public IEnumerable<Resident> GetResidents() => _beaconContext.Residents.ToList();

    [HttpGet("ResidentList")]
    public OkObjectResult GetResidentList()
    {
        var residents = _beaconContext.Residents
            .Select(r => new
            {
                r.ResidentId,
                r.SafehouseId,
                r.CaseStatus,
                r.Sex,
                r.DateOfBirth
            })
            .ToList();

        return Ok(residents);
    }

    [HttpGet("Safehouses")]
    public IEnumerable<Safehouse> GetSafehouses() => _beaconContext.Safehouses.ToList();
    
    [HttpGet("Partners")]
    public IEnumerable<Partner> GetPartner() => _beaconContext.Partners.ToList();

    [HttpGet("admin/residents")]
    [Authorize(Policy = AuthPolicies.ManageResidents)]
    public async Task<IActionResult> GetResidentsForAdmin()
    {
        var residents = await _beaconContext.Residents.ToListAsync();
        return Ok(residents);
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.ManageResidents)]
    public async Task<IActionResult> CreateResident([FromBody] Resident resident)
    {
        var nextResidentId = _beaconContext.Residents.Max(r => (int?)r.ResidentId ?? 0) + 1;
        resident.ResidentId = nextResidentId;
        _beaconContext.Residents.Add(resident);
        await _beaconContext.SaveChangesAsync();
        return Created($"/residents/{resident.ResidentId}", resident);
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
            .Take(10)
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
            .Take(10)
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
            .Take(10)
            .ToList();
        var results = supporters.Cast<object>()
            .Concat(partners)
            .Concat(safehouses)
            .ToList();
        return Ok(results);
    }
    [HttpGet("Supporter/{id}")]
    public IActionResult GetDonor(int id)
    {
        var donor = _beaconContext.Supporters.FirstOrDefault(s => s.SupporterId == id);
        if (donor == null) return NotFound();
        return Ok(donor);
    }
    [HttpGet("Partner/{id}")]
    public IActionResult GetPartner(int id)
    {
        var partner = _beaconContext.Partners.FirstOrDefault(p => p.PartnerId == id);
        if (partner == null) return NotFound();
        return Ok(partner);
    }
    [HttpGet("Safehouse/{id}")]
    public IActionResult GetSafehouse(int id)
    {
        var safehouse = _beaconContext.Safehouses.FirstOrDefault(s => s.SafehouseId == id);
        if (safehouse == null) return NotFound();
        return Ok(safehouse);
    }
}
