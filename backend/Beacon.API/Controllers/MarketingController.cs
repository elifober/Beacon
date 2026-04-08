// Controllers/MarketingController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Beacon.Api.Models.PostPlanner;
using Beacon.Api.Services.PostPlanner;

namespace Beacon.Api.Controllers;

[ApiController]
[Route("api/marketing")]
//[Authorize(Roles = "Admin,Marketing")]
public class MarketingController : ControllerBase
{
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
