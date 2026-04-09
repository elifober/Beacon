import type { DonorHistoryItem } from "../types/DonorDashboard";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

interface MonetaryDonationHistoryProps {
  history: DonorHistoryItem[];
}

function MonetaryDonationHistory({ history }: MonetaryDonationHistoryProps) {
  const monetary = history.filter(
    (item) => item.donationType?.toLowerCase() === "monetary"
  );

  if (monetary.length === 0) {
    return (
      <div className="alert alert-secondary">No monetary donations found.</div>
    );
  }

  return (
    <div className="card beacon-detail-card">
      <div className="card-body">
        <h2 className="card-title h5 mb-3">Monetary Donations</h2>
        <table className="table table-striped table-hover mb-0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Program Area</th>
            </tr>
          </thead>
          <tbody>
            {monetary.map((item, i) => (
              <tr key={i}>
                <td>{formatDate(item.donationDate)}</td>
                <td>
                  {item.amount != null
                    ? `₱${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
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

export default MonetaryDonationHistory;
