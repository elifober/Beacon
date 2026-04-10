import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BASE_URL } from "../config/api";
import type { Safehouse } from "../types/Safehouse";
import Pagination from "../components/Pagination";
import AdminSearchInput from "../components/AdminSearchInput";
import AdminDashboardBackLink from "../components/AdminDashboardBackLink";
import { useAdminSearch } from "../context/AdminSearchContext";
import { CreateSafehouseModal } from "../components/admin/AdminCreateEntityModals";
import BeaconLoadingMark from "../components/BeaconLoadingMark.tsx";
import heroForestImage from "../assets/forrest.jpg";

function AdminAllSafehousesPage() {
  const [safehouses, setSafehouses] = useState<Safehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const { query } = useAdminSearch();
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshList, setRefreshList] = useState(0);
  const [heroFallback, setHeroFallback] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${BASE_URL}/Safehouses`, { credentials: "include" })
      .then((res) => res.json())
      .then(setSafehouses)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [refreshList]);

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
      <div className="beacon-page beacon-page--loading text-center admin-list-page">
        <BeaconLoadingMark />
      </div>
    );
  }

  if (error) {
    return (
      <div className="beacon-page container py-4 admin-list-page">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard beacon-page">
      <header className="admin-dashboard__hero" aria-label="Safehouses header">
        <img
          className="admin-dashboard__hero-img"
          src={heroFallback ? heroForestImage : "/safehouses_page.jpg"}
          alt=""
          decoding="async"
          onError={() => setHeroFallback(true)}
        />
        <div className="admin-dashboard__hero-overlay" aria-hidden="true" />
        <div className="container admin-dashboard__hero-content">
          <p className="admin-dashboard__hero-eyebrow">Admin</p>
          <h1 className="admin-dashboard__hero-title">All Safehouses</h1>
          <p className="post-planner__lead admin-dashboard__hero-subtitle mb-0" style={{ color: "rgba(242, 244, 240, 0.88)" }}>
            Manage locations, capacity, and operational status across safehouses.
          </p>
        </div>
      </header>

      <section className="admin-dashboard__main">
        <div className="container">
          <CreateSafehouseModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onSaved={() => setRefreshList((n) => n + 1)}
          />
          <AdminDashboardBackLink />
          <AdminSearchInput placeholder="Search safehouses by city, province, country, or status..." />
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <button
              type="button"
              className="btn btn-success"
              onClick={() => setCreateOpen(true)}
            >
              New safehouse
            </button>
          </div>
          <div className="row g-4">
            {visibleSafehouses.map((s) => {
              const title = s.city ?? s.name ?? "Unknown safehouse";
              return (
                <div key={s.safehouseId} className="col-sm-6 col-lg-4">
                  <Link
                    to={`/safehouse/${s.safehouseId}`}
                    className="admin-all-residents-card-link text-decoration-none text-reset d-block h-100"
                    aria-label={`Open safehouse details for ${title}`}
                  >
                    <div className="admin-all-residents-card card h-100 shadow-sm">
                      <div className="card-body">
                        <h5 className="card-title mb-3">{title}</h5>
                        <table className="table table-sm mb-0">
                          <tbody>
                            {s.province && <tr><th>Province</th><td>{s.province}</td></tr>}
                            {s.country && <tr><th>Country</th><td>{s.country}</td></tr>}
                            {s.status && <tr><th>Status</th><td>{s.status}</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
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
      </section>
    </div>
  );
}

export default AdminAllSafehousesPage;
