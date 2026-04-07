using Beacon.API.Models;
using Microsoft.AspNetCore.Mvc;

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
}
