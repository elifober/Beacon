import { useEffect, useMemo, useState } from "react";
import Pagination from "../components/Pagination";
import AdminSearchInput from "../components/AdminSearchInput";
import AdminDashboardBackLink from "../components/AdminDashboardBackLink";
import AdminGlassFilterBar, {
  type AdminGlassFilterSection,
} from "../components/AdminGlassFilterBar";
import { useAdminSearch } from "../context/AdminSearchContext";
import { BASE_URL } from "../config/api";

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
  const [openFilterMenu, setOpenFilterMenu] = useState<string | null>(null);
  const [listFilters, setListFilters] = useState({
    status: "",
    region: "",
    organization: "",
    role: "",
  });

  useEffect(() => {
    fetch(`${BASE_URL}/AllPartners`, { credentials: "include" })
      .then((res) => res.json())
      .then(setPartners)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const statusOptions = useMemo(
    () => uniqueField(partners, (p) => p.status),
    [partners],
  );
  const regionOptions = useMemo(
    () => uniqueField(partners, (p) => p.region),
    [partners],
  );
  const orgOptions = useMemo(
    () => uniqueField(partners, (p) => p.organizationType),
    [partners],
  );
  const roleOptions = useMemo(
    () => uniqueField(partners, (p) => p.roleType),
    [partners],
  );

  const partnerGlassSections = useMemo<AdminGlassFilterSection[]>(
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
        id: "organization",
        tabLabel: "Org type",
        allOption: {
          title: "All organization types",
        },
        choices: orgOptions.map((v) => ({
          value: v,
          title: v,
        })),
      },
      {
        id: "role",
        tabLabel: "Role",
        allOption: { title: "All roles" },
        choices: roleOptions.map((v) => ({
          value: v,
          title: v,
        })),
      },
    ],
    [statusOptions, regionOptions, orgOptions, roleOptions],
  );

  const filteredPartners = useMemo(
    () =>
      partners.filter((partner) => {
        if (normalizedQuery) {
          const matchesSearch = [
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
            .some((value) =>
              String(value).toLowerCase().includes(normalizedQuery),
            );
          if (!matchesSearch) return false;
        }

        if (
          listFilters.status &&
          (partner.status?.trim() ?? "") !== listFilters.status
        ) {
          return false;
        }
        if (
          listFilters.region &&
          (partner.region?.trim() ?? "") !== listFilters.region
        ) {
          return false;
        }
        if (
          listFilters.organization &&
          (partner.organizationType?.trim() ?? "") !==
            listFilters.organization
        ) {
          return false;
        }
        if (
          listFilters.role &&
          (partner.roleType?.trim() ?? "") !== listFilters.role
        ) {
          return false;
        }

        return true;
      }),
    [partners, normalizedQuery, listFilters],
  );

  useEffect(() => {
    setPage(1);
  }, [normalizedQuery, view, listFilters]);

  const totalCount = filteredPartners.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visiblePartners = filteredPartners.slice(
    startIndex,
    startIndex + pageSize,
  );

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
      <AdminSearchInput placeholder="Search partners by name, role, safehouse, or status..." />

      <AdminGlassFilterBar
        ariaLabel="Filter partners"
        openMenu={openFilterMenu}
        setOpenMenu={setOpenFilterMenu}
        values={listFilters}
        onValueChange={(sectionId, value) =>
          setListFilters((prev) => ({ ...prev, [sectionId]: value }))
        }
        sections={partnerGlassSections}
      />

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <p className="landing-section__eyebrow mb-1">Admin</p>
          <h1 className="mb-0">All Partners</h1>
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
              <div className="admin-all-residents-card card h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title mb-3">{p.partnerName}</h5>
                  <dl className="row small mb-0 flex-grow-1">
                    <dt className="col-5 text-muted fw-normal">Org type</dt>
                    <dd className="col-7 mb-2">
                      {p.organizationType ?? "\u2014"}
                    </dd>
                    <dt className="col-5 text-muted fw-normal">Role</dt>
                    <dd className="col-7 mb-2">{p.roleType ?? "\u2014"}</dd>
                    <dt className="col-5 text-muted fw-normal">Region</dt>
                    <dd className="col-7 mb-2">{p.region ?? "\u2014"}</dd>
                    <dt className="col-5 text-muted fw-normal">Status</dt>
                    <dd className="col-7 mb-2">{p.status ?? "\u2014"}</dd>
                    <dt className="col-5 text-muted fw-normal">Safehouse</dt>
                    <dd className="col-7 mb-2">
                      {p.assignedSafehouse ?? "\u2014"}
                    </dd>
                    <dt className="col-5 text-muted fw-normal">Start</dt>
                    <dd className="col-7 mb-0">
                      {p.startDate ? formatDate(p.startDate) : "\u2014"}
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

export default AdminAllPartnersPage;
