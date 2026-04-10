namespace Beacon.API.Models;

/// <summary>
/// Body for <c>POST /Beacon/DonorSelf/MonetaryDonation</c>. Server fills supporter, dates, currency, channel, etc.
/// </summary>
public sealed class SubmitMonetaryDonationRequest
{
    public decimal Amount { get; set; }

    /// <summary>True when the donor chose &quot;Monthly&quot; on the donate page.</summary>
    public bool IsRecurring { get; set; }
}
