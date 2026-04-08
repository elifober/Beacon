// Models/PostPlanner/PostPredictionRequest.cs
namespace Beacon.Api.Models.PostPlanner;

public class PostPredictionRequest
{
    // Categorical (will be one-hot encoded server-side)
    public string Platform { get; set; } = "Facebook";       // Facebook, Instagram, Twitter, TikTok, YouTube
    public string PostType { get; set; } = "Organic";        // Organic, Paid, Story, Reel
    public string MediaType { get; set; } = "Image";         // Image, Video, Carousel, Text
    public string ContentTopic { get; set; } = "ImpactStory";// FundraisingAppeal, ImpactStory, ThankYou, EventPromotion, EducationalContent, Informative, etc.
    public string SentimentTone { get; set; } = "Emotional"; // Emotional, Informative, Inspirational, Urgent

    // Numeric
    public int PostHour { get; set; } = 12;           // 0-23
    public int NumHashtags { get; set; }
    public int MentionsCount { get; set; }
    public int CaptionLength { get; set; }

    // Boolean flags (sent as 0/1 to the model)
    public bool IsPeakHour { get; set; }
    public bool IsVideo { get; set; }
    public bool HasCampaign { get; set; }
    public bool HasCallToAction { get; set; }
    public bool FeaturesResidentStory { get; set; }
    public bool IsBoosted { get; set; }
}

