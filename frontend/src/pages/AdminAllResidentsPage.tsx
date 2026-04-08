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
  const [residents, setResidents] = useState<AdminResident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [view, setView] = useState<"table" | "card">("table");

  useEffect(() => {
    fetch(`${BASE_URL}/AllResidents`)
      .then((res) => res.json())
      .then(setResidents)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const totalCount = residents.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleResidents = residents.slice(startIndex, startIndex + pageSize);

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
                  <th>ID</th>
                  <th>Name</th>
                  <th>Safehouse City</th>
                  <th>Sex</th>
                  <th>Date of Birth</th>
                  <th>Religion</th>
                  <th>Case Category</th>
                  <th>Date of Admission</th>
                  <th>Reintegration</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {visibleResidents.map((r) => (
                  <tr key={r.residentId}>
                    <td>{r.residentId}</td>
                    <td>{r.name}</td>
                    <td>{r.safehouseCity ?? "\u2014"}</td>
                    <td>{r.sex ?? "\u2014"}</td>
                    <td>{r.dateOfBirth ? formatDate(r.dateOfBirth) : "\u2014"}</td>
                    <td>{r.religion ?? "\u2014"}</td>
                    <td>{r.caseCategory ?? "\u2014"}</td>
                    <td>{r.dateOfAdmission ? formatDate(r.dateOfAdmission) : "\u2014"}</td>
                    <td>{r.reintegrationStatus ?? "\u2014"}</td>
                    <td>{r.currentRiskLevel ?? "\u2014"}</td>
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
            {visibleResidents.map((r) => (
              <div key={r.residentId} className="col-sm-6 col-lg-4">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title mb-3">{r.name}</h5>
                    <table className="table table-sm mb-0">
                      <tbody>
                        {r.safehouseCity && (
                          <tr>
                            <th>City</th>
                            <td>{r.safehouseCity}</td>
                          </tr>
                        )}
                        {r.sex && (
                          <tr>
                            <th>Sex</th>
                            <td>{r.sex}</td>
                          </tr>
                        )}
                        {r.dateOfBirth && (
                          <tr>
                            <th>Age</th>
                            <td>{calculateAge(r.dateOfBirth)}</td>
                          </tr>
                        )}
                        {r.religion && (
                          <tr>
                            <th>Religion</th>
                            <td>{r.religion}</td>
                          </tr>
                        )}
                        {r.caseCategory && (
                          <tr>
                            <th>Category</th>
                            <td>{r.caseCategory}</td>
                          </tr>
                        )}
                        {r.caseStatus && (
                          <tr>
                            <th>Status</th>
                            <td>{r.caseStatus}</td>
                          </tr>
                        )}
                        {r.dateOfAdmission && (
                          <tr>
                            <th>Admitted</th>
                            <td>{formatDate(r.dateOfAdmission)}</td>
                          </tr>
                        )}
                        {r.reintegrationStatus && (
                          <tr>
                            <th>Reintegration</th>
                            <td>{r.reintegrationStatus}</td>
                          </tr>
                        )}
                        {r.currentRiskLevel && (
                          <tr>
                            <th>Risk Level</th>
                            <td>{r.currentRiskLevel}</td>
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

export default AdminAllResidentsPage;