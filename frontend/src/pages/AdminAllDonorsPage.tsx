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

interface AdminDonor {
  donorId: number;
  displayName?: string;
  relationship?: string;
  region?: string;
  country?: string;
  email?: string;
  phone?: string;
  status?: string;
  firstDonation?: string;
  acquisitionChannel?: string;
}

function AdminAllDonorsPage() {
  const [donors, setDonors] = useState<AdminDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetch(`${BASE_URL}/AllDonors`)
      .then((res) => res.json())
      .then(setDonors)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const totalCount = donors.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleDonors = donors.slice(startIndex, startIndex + pageSize);

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
      <h1 className="mb-4">All Donors</h1>
      <div className="card">
        <div className="card-body table-responsive">
          <table className="table table-striped table-hover mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Display Name</th>
                <th>Relationship</th>
                <th>Region</th>
                <th>Country</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>First Donation</th>
                <th>Acquisition Channel</th>
              </tr>
            </thead>
            <tbody>
              {visibleDonors.map((d) => (
                <tr key={d.donorId}>
                  <td>{d.donorId}</td>
                  <td>{d.displayName ?? "—"}</td>
                  <td>{d.relationship ?? "—"}</td>
                  <td>{d.region ?? "—"}</td>
                  <td>{d.country ?? "—"}</td>
                  <td>{d.email ?? "—"}</td>
                  <td>{d.phone ?? "—"}</td>
                  <td>{d.status ?? "—"}</td>
                  <td>{d.firstDonation ? formatDate(d.firstDonation) : "—"}</td>
                  <td>{d.acquisitionChannel ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer">
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>
    </div>
  );
}

export default AdminAllDonorsPage;
