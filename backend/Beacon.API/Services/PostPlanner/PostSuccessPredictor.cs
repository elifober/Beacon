// Services/PostPlanner/PostSuccessPredictor.cs
using System.Text.Json;
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;
using Beacon.Api.Models.PostPlanner;

namespace Beacon.Api.Services.PostPlanner;

public class PostSuccessPredictor : IDisposable
{
    private readonly InferenceSession _session;
    private readonly List<string> _featureOrder;
    public double Threshold { get; }

    public PostSuccessPredictor(IWebHostEnvironment env, IConfiguration config)
    {
        var modelPath = Path.Combine(env.ContentRootPath, "MLAssets", "social_media_model.onnx");
        var featurePath = Path.Combine(env.ContentRootPath, "MLAssets", "social_media_feature_order.json");

        _session = new InferenceSession(modelPath);
        _featureOrder = JsonSerializer.Deserialize<List<string>>(File.ReadAllText(featurePath))!;
        Threshold = config.GetValue<double?>("PostPlanner:Threshold") ?? 0.5;
    }

    public PostPredictionResponse Predict(PostPredictionRequest req)
    {
        var features = BuildFeatureVector(req);
        var input = new DenseTensor<float>(features, new[] { 1, features.Length });

        var inputs = new List<NamedOnnxValue>
        {
            NamedOnnxValue.CreateFromTensor("input", input)
        };

        using var results = _session.Run(inputs);

        // With zipmap=False, sklearn classifiers return:
        //   output 0: label (int64)
        //   output 1: probabilities (float[,]) — shape [1, 2]
        var probTensor = results.First(r => r.Name.Contains("prob")).AsTensor<float>();
        double pSuccess = probTensor[0, 1];

        var band = pSuccess >= 0.70 ? "High"
                 : pSuccess >= 0.40 ? "Medium"
                 : "Low";

        return new PostPredictionResponse
        {
            SuccessProbability = pSuccess,
            Threshold = Threshold,
            PredictedSuccess = pSuccess >= Threshold,
            RiskBand = band,
            Interpretation = band switch
            {
                "High"   => $"{pSuccess:P0} likely to succeed — strong post, consider boosting.",
                "Medium" => $"{pSuccess:P0} likely to succeed — decent, tweak hashtags or timing for more reach.",
                _        => $"{pSuccess:P0} likely to succeed — consider a more emotional tone or fundraising appeal."
            }
        };
    }

    private float[] BuildFeatureVector(PostPredictionRequest r)
    {
        // Build a dict keyed by the exact column names from training
        var vals = new Dictionary<string, float>();
        foreach (var col in _featureOrder) vals[col] = 0f;

        // Numeric / boolean columns (must match notebook's column names exactly)
        SetIfPresent(vals, "post_hour", r.PostHour);
        SetIfPresent(vals, "num_hashtags", r.NumHashtags);
        SetIfPresent(vals, "mentions_count", r.MentionsCount);
        SetIfPresent(vals, "caption_length", r.CaptionLength);
        SetIfPresent(vals, "is_peak_hour", r.IsPeakHour ? 1 : 0);
        SetIfPresent(vals, "is_video", r.IsVideo ? 1 : 0);
        SetIfPresent(vals, "has_campaign", r.HasCampaign ? 1 : 0);
        SetIfPresent(vals, "has_call_to_action", r.HasCallToAction ? 1 : 0);
        SetIfPresent(vals, "features_resident_story", r.FeaturesResidentStory ? 1 : 0);
        SetIfPresent(vals, "is_boosted", r.IsBoosted ? 1 : 0);

        // One-hot categoricals — pandas get_dummies format: "<field>_<value>"
        SetIfPresent(vals, $"platform_{r.Platform}", 1);
        SetIfPresent(vals, $"post_type_{r.PostType}", 1);
        SetIfPresent(vals, $"media_type_{r.MediaType}", 1);
        SetIfPresent(vals, $"content_topic_{r.ContentTopic}", 1);
        SetIfPresent(vals, $"sentiment_tone_{r.SentimentTone}", 1);

        // Emit in the exact training order
        return _featureOrder.Select(c => vals[c]).ToArray();
    }

    private static void SetIfPresent(Dictionary<string, float> d, string key, float value)
    {
        if (d.ContainsKey(key)) d[key] = value;
    }

    public void Dispose() => _session.Dispose();
}
