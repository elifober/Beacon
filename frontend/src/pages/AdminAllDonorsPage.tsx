import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../config/api";
import Pagination from "../components/Pagination";
import AdminSearchInput from "../components/AdminSearchInput";
import AdminDashboardBackLink from "../components/AdminDashboardBackLink";
import AdminGlassFilterBar, {
  type AdminGlassFilterSection,
} from "../components/AdminGlassFilterBar";
import { useAdminSearch } from "../context/AdminSearchContext";
import BeaconLoadingMark from "../components/BeaconLoadingMark.tsx";
import heroForestImage from "../assets/forrest.jpg";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

function uniqueField<T>(
  items: T[],
  pick: (p: T) => string | undefined,
): string[] {
  const set = new Set<string>();
  for (const x of items) {
    const v = pick(x)?.trim();
    if (v) set.add(v);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
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
  const navigate = useNavigate();
  const [donors, setDonors] = useState<AdminDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"table" | "card">("card");
  const pageSize = 15;
  const { query } = useAdminSearch();
  const [openFilterMenu, setOpenFilterMenu] = useState<string | null>(null);
  const [listFilters, setListFilters] = useState({
    status: "",
    region: "",
    country: "",
    relationship: "",
  });
  const [heroFallback, setHeroFallback] = useState(false);
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${BASE_URL}/AllDonors`, { credentials: "include" })
      .then((res) => res.json())
      .then(setDonors)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const statusOptions = useMemo(
    () => uniqueField(donors, (d) => d.status),
    [donors],
  );
  const regionOptions = useMemo(
    () => uniqueField(donors, (d) => d.region),
    [donors],
  );
  const countryOptions = useMemo(
    () => uniqueField(donors, (d) => d.country),
    [donors],
  );
  const relationshipOptions = useMemo(
    () => uniqueField(donors, (d) => d.relationship),
    [donors],
  );

  const donorGlassSections = useMemo<AdminGlassFilterSection[]>(
    () => [
      {
        id: "status",
        tabLabel: "Status",
        allOption: { title: "All statuses" },
        choices: statusOptions.map((v) => ({
          value: v,
          title: v,
        })),
      },
      {
        id: "region",
        tabLabel: "Region",
        allOption: { title: "All regions" },
        choices: regionOptions.map((v) => ({
          value: v,
          title: v,
        })),
      },
      {
        id: "country",
        tabLabel: "Country",
        allOption: { title: "All countries" },
        choices: countryOptions.map((v) => ({
          value: v,
          title: v,
        })),
      },
      {
        id: "relationship",
        tabLabel: "Relationship",
        allOption: {
          title: "All relationships",
        },
        choices: relationshipOptions.map((v) => ({
          value: v,
          title: v,
        })),
      },
    ],
    [statusOptions, regionOptions, countryOptions, relationshipOptions],
  );

  const filteredDonors = useMemo(
    () =>
      donors.filter((donor) => {
        if (normalizedQuery) {
          const matchesSearch = [
            donor.displayName,
            donor.relationship,
            donor.region,
            donor.country,
            donor.email,
            donor.phone,
            donor.status,
            donor.acquisitionChannel,
            String(donor.donorId),
          ]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(normalizedQuery),
            );
          if (!matchesSearch) return false;
        }

        if (
          listFilters.status &&
          (donor.status?.trim() ?? "") !== listFilters.status
        ) {
          return false;
        }
        if (
          listFilters.region &&
          (donor.region?.trim() ?? "") !== listFilters.region
        ) {
          return false;
        }
        if (
          listFilters.country &&
          (donor.country?.trim() ?? "") !== listFilters.country
        ) {
          return false;
        }
        if (
          listFilters.relationship &&
          (donor.relationship?.trim() ?? "") !== listFilters.relationship
        ) {
          return false;
        }

        return true;
      }),
    [donors, normalizedQuery, listFilters],
  );

  useEffect(() => {
    setPage(1);
  }, [normalizedQuery, view, listFilters]);

  const totalCount = filteredDonors.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleDonors = filteredDonors.slice(startIndex, startIndex + pageSize);

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
      <header className="admin-dashboard__hero" aria-label="Donors header">
        <img
          className="admin-dashboard__hero-img"
          src={heroFallback ? heroForestImage : "/donors_page.jpg"}
          alt=""
          decoding="async"
          onError={() => setHeroFallback(true)}
        />
        <div className="admin-dashboard__hero-overlay" aria-hidden="true" />
        <div className="container admin-dashboard__hero-content">
          <p className="admin-dashboard__hero-eyebrow">Admin</p>
          <h1 className="admin-dashboard__hero-title">All Donors</h1>
          <p className="post-planner__lead admin-dashboard__hero-subtitle mb-0" style={{ color: "rgba(242, 244, 240, 0.88)" }}>
            Track donor profiles, engagement status, and acquisition details.
          </p>
        </div>
      </header>

      <section className="admin-dashboard__main">
        <div className="container">
          <AdminDashboardBackLink />
          <AdminSearchInput placeholder="Search donors by name, contact, location, or status..." />

          <AdminGlassFilterBar
            ariaLabel="Filter donors"
            openMenu={openFilterMenu}
            setOpenMenu={setOpenFilterMenu}
            values={listFilters}
            onValueChange={(sectionId, value) =>
              setListFilters((prev) => ({ ...prev, [sectionId]: value }))
            }
            sections={donorGlassSections}
          />

          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <div />
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
                  <tr
                    key={d.donorId}
                    role="link"
                    tabIndex={0}
                    aria-label={`Open donor profile for ${d.displayName ?? "donor " + d.donorId}`}
                    className="cursor-pointer"
                    onClick={() => navigate(`/donor/${d.donorId}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/donor/${d.donorId}`);
                      }
                    }}
                  >
                    <td>{d.donorId}</td>
                    <td>{d.displayName ?? "-"}</td>
                    <td>{d.relationship ?? "-"}</td>
                    <td>{d.region ?? "-"}</td>
                    <td>{d.country ?? "-"}</td>
                    <td>{d.email ?? "-"}</td>
                    <td>{d.phone ?? "-"}</td>
                    <td>{d.status ?? "-"}</td>
                    <td>{d.firstDonation ? formatDate(d.firstDonation) : "-"}</td>
                    <td>{d.acquisitionChannel ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="row g-4 admin-donors-grid">
          {visibleDonors.map((d) => (
            <div key={d.donorId} className="col-sm-6 col-lg-4">
              <Link
                to={`/donor/${d.donorId}`}
                className="admin-all-residents-card-link text-decoration-none text-reset d-block h-100"
                aria-label={`Open donor profile for ${d.displayName ?? "donor " + d.donorId}`}
              >
                <div className="admin-all-residents-card admin-donor-card--enhanced card h-100 shadow-sm">
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title admin-donor-card__name mb-3">
                      {d.displayName ?? "Unknown"}
                    </h5>
                    <dl className="row small mb-0 flex-grow-1">
                      <dt className="col-5 text-muted fw-normal admin-donor-card__dt">Status</dt>
                      <dd className="col-7 mb-2 admin-donor-card__status">{d.status ?? "\u2014"}</dd>
                      <dt className="col-5 text-muted fw-normal admin-donor-card__dt">Relationship</dt>
                      <dd className="col-7 mb-2">{d.relationship ?? "\u2014"}</dd>
                      <dt className="col-5 text-muted fw-normal admin-donor-card__dt">Region</dt>
                      <dd className="col-7 mb-2">{d.region ?? "\u2014"}</dd>
                      <dt className="col-5 text-muted fw-normal admin-donor-card__dt">Country</dt>
                      <dd className="col-7 mb-2">{d.country ?? "\u2014"}</dd>
                      <dt className="col-5 text-muted fw-normal admin-donor-card__dt">Email</dt>
                      <dd className="col-7 mb-2">{d.email ?? "\u2014"}</dd>
                      <dt className="col-5 text-muted fw-normal admin-donor-card__dt">First gift</dt>
                      <dd className="col-7 mb-0">
                        {d.firstDonation ? formatDate(d.firstDonation) : "\u2014"}
                      </dd>
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

export default AdminAllDonorsPage;
