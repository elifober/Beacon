// Models/PostPlanner/PostPredictionResponse.cs
public class PostPredictionResponse
{
    public double SuccessProbability { get; set; }   // 0.0 - 1.0
    public double Threshold { get; set; }            // tuned threshold from notebook
    public bool PredictedSuccess { get; set; }
    public string RiskBand { get; set; } = "";       // "Low" / "Medium" / "High"
    public string Interpretation { get; set; } = ""; // human-readable summary
}