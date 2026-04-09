import { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "../config/api";
import type { Safehouse } from "../types/Safehouse";
import Pagination from "../components/Pagination";
import AdminSearchInput from "../components/AdminSearchInput";
import { useAdminSearch } from "../context/AdminSearchContext";

function AdminAllSafehousesPage() {
  const [safehouses, setSafehouses] = useState<Safehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const { query } = useAdminSearch();

  useEffect(() => {
    fetch(`${BASE_URL}/Safehouses`)
      .then((res) => res.json())
      .then(setSafehouses)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredSafehouses = useMemo(
    () =>
      safehouses.filter((safehouse) => {
        if (!normalizedQuery) return true;
        return [safehouse.city, safehouse.province, safehouse.country, safehouse.status, String(safehouse.safehouseId)]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      }),
    [safehouses, normalizedQuery],
  );

  useEffect(() => {
    setPage(1);
  }, [normalizedQuery]);

  const totalCount = filteredSafehouses.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleSafehouses = filteredSafehouses.slice(startIndex, startIndex + pageSize);

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
      <AdminSearchInput placeholder="Search safehouses by city, province, country, or status..." />
      <h1 className="mb-4">All Safehouses</h1>
      <div className="row g-4">
        {visibleSafehouses.map((s) => (
          <div key={s.safehouseId} className="col-sm-6 col-lg-4">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title mb-3">{s.city ?? "Unknown City"}</h5>
                <table className="table table-sm mb-0">
                  <tbody>
                    {s.province && <tr><th>Province</th><td>{s.province}</td></tr>}
                    {s.country && <tr><th>Country</th><td>{s.country}</td></tr>}
                    {s.status && <tr><th>Status</th><td>{s.status}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Pagination
          page={currentPage}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

export default AdminAllSafehousesPage;
