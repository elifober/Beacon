import type { DonorHistoryItem } from "../types/DonorDashboard";

interface DonorHistoryProps {
  history: DonorHistoryItem[];
}

function DonorHistory({ history }: DonorHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="alert alert-secondary">No donation history found.</div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title h5 mb-3">Donation History</h2>
        <table className="table table-striped table-hover mb-0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Program Area</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, i) => (
              <tr key={i}>
                <td>{item.donationDate}</td>
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

export default DonorHistory;
