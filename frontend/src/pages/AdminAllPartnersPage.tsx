import { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "../config/api";
import { fetchJson } from "../lib/fetchJson";
import Pagination from "../components/Pagination";
import AdminSearchInput from "../components/AdminSearchInput";
import { useAdminSearch } from "../context/AdminSearchContext";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

interface AdminPartner {
  partnerId: number;
  partnerName: string;
  organizationType?: string;
  roleType?: string;
  email?: string;
  phone?: string;
  region?: string;
  status?: string;
  startDate?: string;
  assignedSafehouse?: string;
}

function AdminAllPartnersPage() {
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [view, setView] = useState<"table" | "card">("table");
  const { query } = useAdminSearch();

  useEffect(() => {
    fetchJson<AdminPartner[]>(`${BASE_URL}/AllPartners`, {
      credentials: "include",
    })
      .then(setPartners)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredPartners = useMemo(
    () =>
      partners.filter((partner) => {
        if (!normalizedQuery) return true;
        return [
          partner.partnerName,
          partner.organizationType,
          partner.roleType,
          partner.email,
          partner.phone,
          partner.region,
          partner.status,
          partner.assignedSafehouse,
          String(partner.partnerId),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      }),
    [partners, normalizedQuery],
  );

  useEffect(() => {
    setPage(1);
  }, [normalizedQuery, view]);

  const totalCount = filteredPartners.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visiblePartners = filteredPartners.slice(startIndex, startIndex + pageSize);

  if (loading) {
    return (
      <div className="beacon-page beacon-page--loading text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="beacon-page container py-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="beacon-page container py-4">
      <AdminSearchInput placeholder="Search partners by name, role, safehouse, or status..." />
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <p className="landing-section__eyebrow mb-1">Admin</p>
          <h1 className="mb-0">All Partners</h1>
        </div>
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
        <div className="card beacon-detail-card">
          <div className="card-body table-responsive">
            <table className="table table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Partner Name</th>
                  <th>Organization Type</th>
                  <th>Role Type</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Region</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>Assigned Safehouse</th>
                </tr>
              </thead>
              <tbody>
                {visiblePartners.map((p, i) => (
                  <tr key={`${p.partnerId}-${i}`}>
                    <td>{p.partnerId}</td>
                    <td>{p.partnerName}</td>
                    <td>{p.organizationType ?? "\u2014"}</td>
                    <td>{p.roleType ?? "\u2014"}</td>
                    <td>{p.email ?? "\u2014"}</td>
                    <td>{p.phone ?? "\u2014"}</td>
                    <td>{p.region ?? "\u2014"}</td>
                    <td>{p.status ?? "\u2014"}</td>
                    <td>{p.startDate ? formatDate(p.startDate) : "\u2014"}</td>
                    <td>{p.assignedSafehouse ?? "\u2014"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {visiblePartners.map((p, i) => (
            <div key={`${p.partnerId}-${i}`} className="col-sm-6 col-lg-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title mb-3">{p.partnerName}</h5>
                  <table className="table table-sm mb-0">
                    <tbody>
                      {p.organizationType && (
                        <tr>
                          <th>Org Type</th>
                          <td>{p.organizationType}</td>
                        </tr>
                      )}
                      {p.roleType && (
                        <tr>
                          <th>Role</th>
                          <td>{p.roleType}</td>
                        </tr>
                      )}
                      {p.email && (
                        <tr>
                          <th>Email</th>
                          <td>{p.email}</td>
                        </tr>
                      )}
                      {p.phone && (
                        <tr>
                          <th>Phone</th>
                          <td>{p.phone}</td>
                        </tr>
                      )}
                      {p.region && (
                        <tr>
                          <th>Region</th>
                          <td>{p.region}</td>
                        </tr>
                      )}
                      {p.status && (
                        <tr>
                          <th>Status</th>
                          <td>{p.status}</td>
                        </tr>
                      )}
                      {p.startDate && (
                        <tr>
                          <th>Start Date</th>
                          <td>{formatDate(p.startDate)}</td>
                        </tr>
                      )}
                      {p.assignedSafehouse && (
                        <tr>
                          <th>Safehouse</th>
                          <td>{p.assignedSafehouse}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

export default AdminAllPartnersPage;