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
  const [view, setView] = useState<"table" | "card">("table");

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
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">All Donors</h1>
        <div className="btn-group">
          <button
            className={`btn ${view === "table" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setView("table")}
          >
            Table
          </button>
          <button
            className={`btn ${view === "card" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setView("card")}
          >
            Cards
          </button>
        </div>
      </div>

      {view === "table" ? (
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
                    <td>{d.displayName ?? "\u2014"}</td>
                    <td>{d.relationship ?? "\u2014"}</td>
                    <td>{d.region ?? "\u2014"}</td>
                    <td>{d.country ?? "\u2014"}</td>
                    <td>{d.email ?? "\u2014"}</td>
                    <td>{d.phone ?? "\u2014"}</td>
                    <td>{d.status ?? "\u2014"}</td>
                    <td>{d.firstDonation ? formatDate(d.firstDonation) : "\u2014"}</td>
                    <td>{d.acquisitionChannel ?? "\u2014"}</td>
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
      ) : (
        <>
          <div className="row g-4">
            {visibleDonors.map((d) => (
              <div key={d.donorId} className="col-sm-6 col-lg-4">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title mb-3">{d.displayName ?? "Unknown"}</h5>
                    <table className="table table-sm mb-0">
                      <tbody>
                        {d.email && (
                          <tr>
                            <th>Email</th>
                            <td>{d.email}</td>
                          </tr>
                        )}
                        {d.phone && (
                          <tr>
                            <th>Phone</th>
                            <td>{d.phone}</td>
                          </tr>
                        )}
                        {d.status && (
                          <tr>
                            <th>Status</th>
                            <td>{d.status}</td>
                          </tr>
                        )}
                        {d.relationship && (
                          <tr>
                            <th>Relationship</th>
                            <td>{d.relationship}</td>
                          </tr>
                        )}
                        {d.region && (
                          <tr>
                            <th>Region</th>
                            <td>{d.region}</td>
                          </tr>
                        )}
                        {d.country && (
                          <tr>
                            <th>Country</th>
                            <td>{d.country}</td>
                          </tr>
                        )}
                        {d.firstDonation && (
                          <tr>
                            <th>First Donation</th>
                            <td>{formatDate(d.firstDonation)}</td>
                          </tr>
                        )}
                        {d.acquisitionChannel && (
                          <tr>
                            <th>Acquisition</th>
                            <td>{d.acquisitionChannel}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card mt-4">
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
        </>
      )}
    </div>
  );
}

export default AdminAllDonorsPage;