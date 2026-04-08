import { useEffect, useState } from "react";
import { BASE_URL } from "../config/api";
import Pagination from "../components/Pagination";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

interface AdminDonation {
  donationId: number;
  supporterName?: string;
  donationType?: string;
  donationDate: string;
  isRecurring?: boolean;
  amount?: number;
  estimatedValue?: number;
  impactUnit?: string;
  programArea?: string;
  notes?: string;
}

function formatAmount(d: AdminDonation): string {
  const isMonetary = d.donationType?.toLowerCase() === "monetary";
  if (isMonetary && d.amount != null) {
    return `₱${d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }
  if (!isMonetary && d.estimatedValue != null) {
    const val = d.estimatedValue.toLocaleString();
    return d.impactUnit ? `${val} ${d.impactUnit}` : val;
  }
  if (d.amount != null) {
    return `₱${d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }
  if (d.estimatedValue != null) {
    const val = d.estimatedValue.toLocaleString();
    return d.impactUnit ? `${val} ${d.impactUnit}` : val;
  }
  return "—";
}

function AdminAllDonationsPage() {
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    fetch(`${BASE_URL}/AllDonations`)
      .then((res) => res.json())
      .then(setDonations)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const totalCount = donations.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleDonations = donations.slice(startIndex, startIndex + pageSize);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="container py-4"><div className="alert alert-danger">{error}</div></div>;
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4">All Donations</h1>
      <div className="card">
        <div className="card-body table-responsive">
          <table className="table table-striped table-hover mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Supporter</th>
                <th>Type</th>
                <th>Date</th>
                <th>Recurring</th>
                <th>Amount</th>
                <th>Program Area</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {visibleDonations.map((d, i) => (
                <tr key={`${d.donationId}-${i}`}>
                  <td>{d.donationId}</td>
                  <td>{d.supporterName ?? "—"}</td>
                  <td>{d.donationType ?? "—"}</td>
                  <td>{formatDate(d.donationDate)}</td>
                  <td>{d.isRecurring ? "Yes" : "No"}</td>
                  <td>{formatAmount(d)}</td>
                  <td>{d.programArea ?? "—"}</td>
                  <td>{d.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination
        page={currentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        className="mt-4"
      />
    </div>
  );
}

export default AdminAllDonationsPage;
