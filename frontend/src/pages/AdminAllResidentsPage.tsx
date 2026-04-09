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

function AdminAllResidentsPage() {
  const navigate = useNavigate();
  const [residents, setResidents] = useState<AdminResident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [view, setView] = useState<"table" | "card">("card");
  const { query } = useAdminSearch();
  const [openFilterMenu, setOpenFilterMenu] = useState<
    "risk" | "safehouse" | "time-housed" | "age" | null
  >(null);
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [safehouseFilter, setSafehouseFilter] = useState<string>("");
  const [timeHousedFilter, setTimeHousedFilter] = useState<string>("");
  const [ageFilter, setAgeFilter] = useState<string>("");

  useEffect(() => {
    fetch(`${BASE_URL}/AllResidents`, { credentials: "include" })
      .then((res) => res.json())
      .then(setResidents)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

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

        if (riskFilter && (resident.currentRiskLevel?.trim() ?? "") !== riskFilter) {
          return false;
        }
        if (safehouseFilter && (resident.safehouseCity?.trim() ?? "") !== safehouseFilter) {
          return false;
        }
        if (timeHousedFilter) {
          const b = tenureBucket(resident.dateOfAdmission);
          if (b !== timeHousedFilter) return false;
        }
        if (ageFilter) {
          const b = ageBucket(resident.dateOfBirth);
          if (b !== ageFilter) return false;
        }

        return true;
      }),
    [
      residents,
      normalizedQuery,
      riskFilter,
      safehouseFilter,
      timeHousedFilter,
      ageFilter,
    ],
  );

  useEffect(() => {
    setPage(1);
  }, [normalizedQuery, view, riskFilter, safehouseFilter, timeHousedFilter, ageFilter]);

  const totalCount = filteredResidents.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleResidents = filteredResidents.slice(startIndex, startIndex + pageSize);

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

  const TIME_HOUSED_OPTIONS: { value: string; label: string }[] = [
    { value: "", label: "All lengths" },
    { value: "<90", label: "Under 90 days" },
    { value: "90-365", label: "90 days – 1 year" },
    { value: "365-730", label: "1 – 2 years" },
    { value: "730+", label: "Over 2 years" },
    { value: "unknown", label: "Unknown" },
  ];

  const AGE_OPTIONS: { value: string; label: string }[] = [
    { value: "", label: "All ages" },
    { value: "<18", label: "Under 18" },
    { value: "18-25", label: "18 – 24" },
    { value: "25-35", label: "25 – 34" },
    { value: "35+", label: "35+" },
    { value: "unknown", label: "Unknown" },
  ];

  return (
    <div className="beacon-page container py-4">
      <AdminSearchInput placeholder="Search residents by name, ID, safehouse, status, or risk..." />

      <section className="admin-residents-filter mb-3" aria-label="Filter residents">
        <div className="admin-residents-filter__track">
          <div
            className="admin-residents-filter__pill"
            role="toolbar"
            aria-label="Resident filters"
          >
            <button
              type="button"
              className={`admin-residents-filter__tab ${openFilterMenu === "risk" ? "is-open" : ""}`}
              aria-expanded={openFilterMenu === "risk"}
              onClick={() =>
                setOpenFilterMenu((prev) => (prev === "risk" ? null : "risk"))
              }
            >
              Risk
              <i
                className={`admin-residents-filter__chev bi ${openFilterMenu === "risk" ? "bi-chevron-up" : "bi-chevron-down"}`}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              className={`admin-residents-filter__tab ${openFilterMenu === "safehouse" ? "is-open" : ""}`}
              aria-expanded={openFilterMenu === "safehouse"}
              onClick={() =>
                setOpenFilterMenu((prev) =>
                  prev === "safehouse" ? null : "safehouse",
                )
              }
            >
              Safehouse
              <i
                className={`admin-residents-filter__chev bi ${openFilterMenu === "safehouse" ? "bi-chevron-up" : "bi-chevron-down"}`}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              className={`admin-residents-filter__tab ${openFilterMenu === "time-housed" ? "is-open" : ""}`}
              aria-expanded={openFilterMenu === "time-housed"}
              onClick={() =>
                setOpenFilterMenu((prev) =>
                  prev === "time-housed" ? null : "time-housed",
                )
              }
            >
              Time housed
              <i
                className={`admin-residents-filter__chev bi ${openFilterMenu === "time-housed" ? "bi-chevron-up" : "bi-chevron-down"}`}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              className={`admin-residents-filter__tab ${openFilterMenu === "age" ? "is-open" : ""}`}
              aria-expanded={openFilterMenu === "age"}
              onClick={() =>
                setOpenFilterMenu((prev) => (prev === "age" ? null : "age"))
              }
            >
              Age
              <i
                className={`admin-residents-filter__chev bi ${openFilterMenu === "age" ? "bi-chevron-up" : "bi-chevron-down"}`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {openFilterMenu ? (
          <div className="admin-residents-filter__dropdown-wrap">
            <div className="admin-residents-filter__dropdown" role="region">
              {openFilterMenu === "risk" ? (
                <div className="admin-residents-filter__grid">
                  <button
                    type="button"
                    className={`admin-residents-filter__option ${riskFilter === "" ? "is-selected" : ""}`}
                    onClick={() => {
                      setRiskFilter("");
                      setOpenFilterMenu(null);
                    }}
                  >
                    <p className="admin-residents-filter__option-title mb-0">All risk levels</p>
                    <p className="admin-residents-filter__option-meta mb-0">
                      Show everyone
                    </p>
                  </button>
                  {riskOptions.map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`admin-residents-filter__option ${riskFilter === level ? "is-selected" : ""}`}
                      onClick={() => {
                        setRiskFilter(level);
                        setOpenFilterMenu(null);
                      }}
                    >
                      <p className="admin-residents-filter__option-title mb-0">{level}</p>
                      <p className="admin-residents-filter__option-meta mb-0">
                        Filter by this risk level
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}

              {openFilterMenu === "safehouse" ? (
                <div className="admin-residents-filter__grid">
                  <button
                    type="button"
                    className={`admin-residents-filter__option ${safehouseFilter === "" ? "is-selected" : ""}`}
                    onClick={() => {
                      setSafehouseFilter("");
                      setOpenFilterMenu(null);
                    }}
                  >
                    <p className="admin-residents-filter__option-title mb-0">All safehouses</p>
                    <p className="admin-residents-filter__option-meta mb-0">
                      Any city
                    </p>
                  </button>
                  {safehouseOptions.map((city) => (
                    <button
                      key={city}
                      type="button"
                      className={`admin-residents-filter__option ${safehouseFilter === city ? "is-selected" : ""}`}
                      onClick={() => {
                        setSafehouseFilter(city);
                        setOpenFilterMenu(null);
                      }}
                    >
                      <p className="admin-residents-filter__option-title mb-0">{city}</p>
                      <p className="admin-residents-filter__option-meta mb-0">
                        Safehouse city
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}

              {openFilterMenu === "time-housed" ? (
                <div className="admin-residents-filter__grid">
                  {TIME_HOUSED_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value || "all"}
                      type="button"
                      className={`admin-residents-filter__option ${timeHousedFilter === value ? "is-selected" : ""}`}
                      onClick={() => {
                        setTimeHousedFilter(value);
                        setOpenFilterMenu(null);
                      }}
                    >
                      <p className="admin-residents-filter__option-title mb-0">{label}</p>
                      <p className="admin-residents-filter__option-meta mb-0">
                        Based on admission date
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}

              {openFilterMenu === "age" ? (
                <div className="admin-residents-filter__grid">
                  {AGE_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value || "all"}
                      type="button"
                      className={`admin-residents-filter__option ${ageFilter === value ? "is-selected" : ""}`}
                      onClick={() => {
                        setAgeFilter(value);
                        setOpenFilterMenu(null);
                      }}
                    >
                      <p className="admin-residents-filter__option-title mb-0">{label}</p>
                      <p className="admin-residents-filter__option-meta mb-0">
                        From date of birth
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <p className="landing-section__eyebrow mb-1">Admin</p>
          <h1 className="mb-0">All Residents</h1>
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