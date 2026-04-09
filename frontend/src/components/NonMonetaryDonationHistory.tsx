import type { DonorHistoryItem } from "../types/DonorDashboard";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

interface NonMonetaryDonationHistoryProps {
  history: DonorHistoryItem[];
}

function NonMonetaryDonationHistory({ history }: NonMonetaryDonationHistoryProps) {
  const nonMonetary = history.filter(
    (item) => item.donationType?.toLowerCase() !== "monetary"
  );

  if (nonMonetary.length === 0) {
    return (
      <div className="alert alert-secondary">No non-monetary donations found.</div>
    );
  }

  return (
    <div className="card beacon-detail-card">
      <div className="card-body">
        <h2 className="card-title h5 mb-3">Non-Monetary Donations</h2>
        <table className="table table-striped table-hover mb-0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Program Area</th>
            </tr>
          </thead>
          <tbody>
            {nonMonetary.map((item, i) => (
              <tr key={i}>
                <td>{formatDate(item.donationDate)}</td>
                <td>{item.donationType ?? "N/A"}</td>
                <td>
                  {item.estimatedValue != null
                    ? `${item.estimatedValue.toLocaleString()} ${item.impactUnit ?? ""}`.trim()
                    : "N/A"}
                </td>
                <td>{item.programArea ?? "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default NonMonetaryDonationHistory;
