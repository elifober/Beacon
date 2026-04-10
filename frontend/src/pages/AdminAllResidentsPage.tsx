import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../config/api";
import Pagination from "../components/Pagination";
import AdminSearchInput from "../components/AdminSearchInput";
import AdminDashboardBackLink from "../components/AdminDashboardBackLink";
import AdminGlassFilterBar, {
  type AdminGlassFilterChoice,
  type AdminGlassFilterSection,
} from "../components/AdminGlassFilterBar";
import { useAdminSearch } from "../context/AdminSearchContext";
import { CreateResidentModal } from "../components/admin/AdminCreateEntityModals";
import BeaconLoadingMark from "../components/BeaconLoadingMark.tsx";
import heroForestImage from "../assets/forrest.jpg";

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

function daysSinceAdmission(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function tenureBucket(dateOfAdmission?: string): string {
  const days = daysSinceAdmission(dateOfAdmission);
  if (days === null) return "unknown";
  if (days < 90) return "<90";
  if (days < 365) return "90-365";
  if (days < 730) return "365-730";
  return "730+";
}

function ageBucket(dateOfBirth?: string): string {
  if (!dateOfBirth) return "unknown";
  const age = calculateAge(dateOfBirth);
  if (age < 18) return "<18";
  if (age < 25) return "18-25";
  if (age < 35) return "25-35";
  return "35+";
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

const RESIDENT_TIME_CHOICES: AdminGlassFilterChoice[] = [
  { value: "<90", title: "Under 90 days" },
  { value: "90-365", title: "90 days – 1 year" },
  { value: "365-730", title: "1 – 2 years" },
  { value: "730+", title: "Over 2 years" },
  { value: "unknown", title: "Unknown" },
];

const RESIDENT_AGE_CHOICES: AdminGlassFilterChoice[] = [
  { value: "<18", title: "Under 18" },
  { value: "18-25", title: "18 – 24" },
  { value: "25-35", title: "25 – 34" },
  { value: "35+", title: "35+" },
  { value: "unknown", title: "Unknown" },
];

function AdminAllResidentsPage() {
  const navigate = useNavigate();
  const [residents, setResidents] = useState<AdminResident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [view, setView] = useState<"table" | "card">("card");
  const { query } = useAdminSearch();
  const [openFilterMenu, setOpenFilterMenu] = useState<string | null>(null);
  const [listFilters, setListFilters] = useState({
    risk: "",
    safehouse: "",
    "time-housed": "",
    age: "",
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshList, setRefreshList] = useState(0);
  const [heroFallback, setHeroFallback] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${BASE_URL}/AllResidents`, { credentials: "include" })
      .then((res) => res.json())
      .then(setResidents)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [refreshList]);

  const normalizedQuery = query.trim().toLowerCase();

  const riskOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of residents) {
      if (r.currentRiskLevel?.trim()) set.add(r.currentRiskLevel.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [residents]);

  const safehouseOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of residents) {
      if (r.safehouseCity?.trim()) set.add(r.safehouseCity.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [residents]);

  const residentGlassSections = useMemo<AdminGlassFilterSection[]>(
    () => [
      {
        id: "risk",
        tabLabel: "Risk",
        allOption: { title: "All risk levels" },
        choices: riskOptions.map((level) => ({
          value: level,
          title: level,
        })),
      },
      {
        id: "safehouse",
        tabLabel: "Safehouse",
        allOption: { title: "All safehouses" },
        choices: safehouseOptions.map((city) => ({
          value: city,
          title: city,
        })),
      },
      {
        id: "time-housed",
        tabLabel: "Time housed",
        allOption: { title: "All lengths" },
        choices: RESIDENT_TIME_CHOICES,
      },
      {
        id: "age",
        tabLabel: "Age",
        allOption: { title: "All ages" },
        choices: RESIDENT_AGE_CHOICES,
      },
    ],
    [riskOptions, safehouseOptions],
  );

  const filteredResidents = useMemo(
    () =>
      residents.filter((resident) => {
        if (!normalizedQuery) {
          /* continue */
        } else {
          const matchesSearch = [
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
          if (!matchesSearch) return false;
        }

        if (
          listFilters.risk &&
          (resident.currentRiskLevel?.trim() ?? "") !== listFilters.risk
        ) {
          return false;
        }
        if (
          listFilters.safehouse &&
          (resident.safehouseCity?.trim() ?? "") !== listFilters.safehouse
        ) {
          return false;
        }
        if (listFilters["time-housed"]) {
          if (
            tenureBucket(resident.dateOfAdmission) !== listFilters["time-housed"]
          ) {
            return false;
          }
        }
        if (listFilters.age) {
          if (ageBucket(resident.dateOfBirth) !== listFilters.age) return false;
        }

        return true;
      }),
    [residents, normalizedQuery, listFilters],
  );

  useEffect(() => {
    setPage(1);
  }, [normalizedQuery, view, listFilters]);

  const totalCount = filteredResidents.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleResidents = filteredResidents.slice(startIndex, startIndex + pageSize);

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
      <header className="admin-dashboard__hero" aria-label="Residents header">
        <img
          className="admin-dashboard__hero-img"
          src={heroFallback ? heroForestImage : "/resident_page.jpg"}
          alt=""
          decoding="async"
          onError={() => setHeroFallback(true)}
        />
        <div className="admin-dashboard__hero-overlay" aria-hidden="true" />
        <div className="container admin-dashboard__hero-content">
          <p className="admin-dashboard__hero-eyebrow">Admin</p>
          <h1 className="admin-dashboard__hero-title">All Residents</h1>
          <p className="post-planner__lead admin-dashboard__hero-subtitle mb-0" style={{ color: "rgba(242, 244, 240, 0.88)" }}>
            Review resident profiles, status, risk level, and housing details.
          </p>
        </div>
      </header>

      <section className="admin-dashboard__main">
        <div className="container">
          <CreateResidentModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onSaved={() => setRefreshList((n) => n + 1)}
          />
          <AdminDashboardBackLink />
          <AdminSearchInput placeholder="Search residents by name, ID, safehouse, status, or risk..." />

          <AdminGlassFilterBar
            ariaLabel="Filter residents"
            openMenu={openFilterMenu}
            setOpenMenu={setOpenFilterMenu}
            values={listFilters}
            onValueChange={(sectionId, value) =>
              setListFilters((prev) => ({ ...prev, [sectionId]: value }))
            }
            sections={residentGlassSections}
          />

          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <div>
              <button
                type="button"
                className="btn admin-residents-new-btn"
                onClick={() => setCreateOpen(true)}
              >
                New resident
              </button>
            </div>
            <div className="btn-group">
              <button
                type="button"
                className={`btn ${view === "table" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setView("table")}
              >
                Table
              </button>
              <button
                type="button"
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
        <div className="row g-4 admin-residents-grid">
          {visibleResidents.map((r) => (
            <div key={r.residentId} className="col-sm-6 col-lg-4">
              <Link
                to={`/resident/${r.residentId}`}
                className="admin-all-residents-card-link text-decoration-none text-reset d-block h-100"
                aria-label={`Open resident profile for ${r.name}`}
              >
                <div className="admin-all-residents-card admin-resident-card--enhanced card h-100 shadow-sm">
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title admin-resident-card__name mb-3">{r.name}</h5>
                    <dl className="row small mb-0 flex-grow-1">
                      <dt className="col-5 text-muted fw-normal admin-resident-card__dt">Safehouse</dt>
                      <dd className="col-7 mb-2">
                        {r.safehouseCity ?? "\u2014"}
                      </dd>
                      <dt className="col-5 text-muted fw-normal admin-resident-card__dt">Sex</dt>
                      <dd className="col-7 mb-2">{r.sex ?? "\u2014"}</dd>
                      <dt className="col-5 text-muted fw-normal admin-resident-card__dt">Age</dt>
                      <dd className="col-7 mb-2">
                        {r.dateOfBirth
                          ? calculateAge(r.dateOfBirth)
                          : "\u2014"}
                      </dd>
                      <dt className="col-5 text-muted fw-normal admin-resident-card__dt">Status</dt>
                      <dd className="col-7 mb-0 admin-resident-card__status">{r.caseStatus ?? "\u2014"}</dd>
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
      </section>
    </div>
  );
}

export default AdminAllResidentsPage;