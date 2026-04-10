// Controllers/MarketingController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Beacon.Api.Models.PostPlanner;
using Beacon.Api.Services.PostPlanner;
using Beacon.API.Data;

namespace Beacon.Api.Controllers;

[ApiController]
[Route("api/marketing")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class MarketingController : ControllerBase
{
    // Post Planner / marketing ML endpoints.
    //
    // Architecture notes:
    // - AdminOnly because this feature is intended for staff planning, not public browsing.
    // - The predictor is a singleton service that loads model assets/config once at startup.
    private readonly PostSuccessPredictor _predictor;

    public MarketingController(PostSuccessPredictor predictor)
    {
        _predictor = predictor;
    }

    [HttpPost("predict-post")]
    public ActionResult<PostPredictionResponse> PredictPost([FromBody] PostPredictionRequest request)
    {
        try
        {
            var result = _predictor.Predict(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Prediction failed", detail = ex.Message });
        }
    }
}
