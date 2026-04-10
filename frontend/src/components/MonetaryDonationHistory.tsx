import type { DonorHistoryItem } from "../types/DonorDashboard";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

function filterMonetary(history: DonorHistoryItem[]): DonorHistoryItem[] {
  return history.filter((item) => item.donationType?.toLowerCase() === "monetary");
}

export interface MonetaryDonationHistoryProps {
  history: DonorHistoryItem[];
  /**
   * When set, renders only the table (no card/title). Rows should already be monetary
   * and typically a single page slice.
   */
  embeddedTableRows?: DonorHistoryItem[];
}

function MonetaryDonationHistory({ history, embeddedTableRows }: MonetaryDonationHistoryProps) {
  const monetary = embeddedTableRows ?? filterMonetary(history);
  const embedded = embeddedTableRows != null;

  const inner =
    monetary.length === 0 ? (
      <div className="alert alert-secondary mb-0">No monetary donations found.</div>
    ) : (
      <div className="table-responsive">
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
              <tr key={`${item.donationDate}-${i}`}>
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
    );

  if (embedded) {
    return inner;
  }

  return (
    <div className="card beacon-detail-card">
      <div className="card-body">
        <h2 className="card-title h5 mb-3">Monetary Donations</h2>
        {inner}
      </div>
    </div>
  );
}

export default MonetaryDonationHistory;
