import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../config/api";
import Pagination from "../components/Pagination";
import AdminSearchInput from "../components/AdminSearchInput";
import { useAdminSearch } from "../context/AdminSearchContext";

function calculateAge(dateStr: string): number {
  const dob = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

interface AdminResident {
  residentId: number;
  name: string;
  safehouseCity?: string;
  sex?: string;
  dateOfBirth?: string;
  religion?: string;
  caseCategory?: string;
  caseStatus?: string;
  dateOfAdmission?: string;
  reintegrationStatus?: string;
  currentRiskLevel?: string;
}

function AdminAllResidentsPage() {
  const navigate = useNavigate();
  const [residents, setResidents] = useState<AdminResident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [view, setView] = useState<"table" | "card">("card");
  const { query } = useAdminSearch();

  useEffect(() => {
    fetch(`${BASE_URL}/AllResidents`, { credentials: "include" })
      .then((res) => res.json())
      .then(setResidents)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredResidents = useMemo(
    () =>
      residents.filter((resident) => {
        if (!normalizedQuery) return true;
        return [
          resident.name,
          String(resident.residentId),
          resident.safehouseCity,
          resident.sex,
          resident.caseCategory,
          resident.caseStatus,
          resident.reintegrationStatus,
          resident.currentRiskLevel,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      }),
    [residents, normalizedQuery],
  );

  useEffect(() => {
    setPage(1);
  }, [normalizedQuery, view]);

  const totalCount = filteredResidents.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleResidents = filteredResidents.slice(startIndex, startIndex + pageSize);

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
      <AdminSearchInput placeholder="Search residents by name, ID, safehouse, status, or risk..." />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">All Residents</h1>
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
                  <th>Name</th>
                  <th>Safehouse</th>
                  <th>Sex</th>
                  <th>Age</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleResidents.map((r) => (
                  <tr
                    key={r.residentId}
                    role="link"
                    tabIndex={0}
                    aria-label={`Open resident profile for ${r.name}`}
                    className="cursor-pointer"
                    onClick={() => navigate(`/resident/${r.residentId}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/resident/${r.residentId}`);
                      }
                    }}
                  >
                    <td className="admin-all-residents-name-cell">
                      <span className="admin-all-residents-name">{r.name}</span>
                    </td>
                    <td>{r.safehouseCity ?? "\u2014"}</td>
                    <td>{r.sex ?? "\u2014"}</td>
                    <td>
                      {r.dateOfBirth
                        ? calculateAge(r.dateOfBirth)
                        : "\u2014"}
                    </td>
                    <td>{r.caseStatus ?? "\u2014"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {visibleResidents.map((r) => (
            <div key={r.residentId} className="col-sm-6 col-lg-4">
              <Link
                to={`/resident/${r.residentId}`}
                className="admin-all-residents-card-link text-decoration-none text-reset d-block h-100"
                aria-label={`Open resident profile for ${r.name}`}
              >
                <div className="admin-all-residents-card card h-100 shadow-sm">
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title mb-3">{r.name}</h5>
                    <dl className="row small mb-0 flex-grow-1">
                      <dt className="col-5 text-muted fw-normal">Safehouse</dt>
                      <dd className="col-7 mb-2">
                        {r.safehouseCity ?? "\u2014"}
                      </dd>
                      <dt className="col-5 text-muted fw-normal">Sex</dt>
                      <dd className="col-7 mb-2">{r.sex ?? "\u2014"}</dd>
                      <dt className="col-5 text-muted fw-normal">Age</dt>
                      <dd className="col-7 mb-2">
                        {r.dateOfBirth
                          ? calculateAge(r.dateOfBirth)
                          : "\u2014"}
                      </dd>
                      <dt className="col-5 text-muted fw-normal">Status</dt>
                      <dd className="col-7 mb-0">{r.caseStatus ?? "\u2014"}</dd>
                    </dl>
                  </div>
                </div>
              </Link>
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

export default AdminAllResidentsPage;