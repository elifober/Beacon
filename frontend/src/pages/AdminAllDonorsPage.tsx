import { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "../config/api";
import Pagination from "../components/Pagination";
import AdminSearchInput from "../components/AdminSearchInput";
import AdminDashboardBackLink from "../components/AdminDashboardBackLink";
import AdminGlassFilterBar, {
  type AdminGlassFilterSection,
} from "../components/AdminGlassFilterBar";
import { useAdminSearch } from "../context/AdminSearchContext";

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
  const [donors, setDonors] = useState<AdminDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"table" | "card">("table");
  const pageSize = 15;
  const { query } = useAdminSearch();
  const [openFilterMenu, setOpenFilterMenu] = useState<string | null>(null);
  const [listFilters, setListFilters] = useState({
    status: "",
    region: "",
    country: "",
    relationship: "",
  });

  useEffect(() => {
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
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
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
    <div className="beacon-page container py-4 admin-list-page">
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
        <div>
          <p className="landing-section__eyebrow mb-1">Admin</p>
          <h1 className="mb-0">All Donors</h1>
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
        <div className="row g-4">
          {visibleDonors.map((d) => (
            <div key={d.donorId} className="col-sm-6 col-lg-4">
              <div className="admin-all-residents-card card h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title mb-3">{d.displayName ?? "Unknown"}</h5>
                  <dl className="row small mb-0 flex-grow-1">
                    <dt className="col-5 text-muted fw-normal">Status</dt>
                    <dd className="col-7 mb-2">{d.status ?? "\u2014"}</dd>
                    <dt className="col-5 text-muted fw-normal">Relationship</dt>
                    <dd className="col-7 mb-2">{d.relationship ?? "\u2014"}</dd>
                    <dt className="col-5 text-muted fw-normal">Region</dt>
                    <dd className="col-7 mb-2">{d.region ?? "\u2014"}</dd>
                    <dt className="col-5 text-muted fw-normal">Country</dt>
                    <dd className="col-7 mb-2">{d.country ?? "\u2014"}</dd>
                    <dt className="col-5 text-muted fw-normal">Email</dt>
                    <dd className="col-7 mb-2">{d.email ?? "\u2014"}</dd>
                    <dt className="col-5 text-muted fw-normal">First gift</dt>
                    <dd className="col-7 mb-0">
                      {d.firstDonation ? formatDate(d.firstDonation) : "\u2014"}
                    </dd>
                  </dl>
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

export default AdminAllDonorsPage;
