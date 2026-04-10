import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Pagination from "../components/Pagination";
import AdminSearchInput from "../components/AdminSearchInput";
import AdminDashboardBackLink from "../components/AdminDashboardBackLink";
import AdminGlassFilterBar, {
  type AdminGlassFilterSection,
} from "../components/AdminGlassFilterBar";
import { useAdminSearch } from "../context/AdminSearchContext";
import { BASE_URL } from "../config/api";
import { CreatePartnerModal } from "../components/admin/AdminCreateEntityModals";
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
  const navigate = useNavigate();
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [view, setView] = useState<"table" | "card">("card");
  const { query } = useAdminSearch();
  const [openFilterMenu, setOpenFilterMenu] = useState<string | null>(null);
  const [listFilters, setListFilters] = useState({
    status: "",
    region: "",
    organization: "",
    role: "",
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshList, setRefreshList] = useState(0);
  const [heroFallback, setHeroFallback] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${BASE_URL}/AllPartners`, { credentials: "include" })
      .then((res) => res.json())
      .then(setPartners)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [refreshList]);

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
      <header className="admin-dashboard__hero" aria-label="Partners header">
        <img
          className="admin-dashboard__hero-img"
          src={heroFallback ? heroForestImage : "/partners_page.jpg"}
          alt=""
          decoding="async"
          onError={() => setHeroFallback(true)}
        />
        <div className="admin-dashboard__hero-overlay" aria-hidden="true" />
        <div className="container admin-dashboard__hero-content">
          <p className="admin-dashboard__hero-eyebrow">Admin</p>
          <h1 className="admin-dashboard__hero-title">All Partners</h1>
          <p className="post-planner__lead admin-dashboard__hero-subtitle mb-0" style={{ color: "rgba(242, 244, 240, 0.88)" }}>
            Manage partner organizations, roles, status, and safehouse assignments.
          </p>
        </div>
      </header>

      <section className="admin-dashboard__main">
        <div className="container">
          <CreatePartnerModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onSaved={() => setRefreshList((n) => n + 1)}
          />
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
              <button
                type="button"
                className="btn admin-partners-new-btn"
                onClick={() => setCreateOpen(true)}
              >
                New partner
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
                  <tr
                    key={`${p.partnerId}-${i}`}
                    role="link"
                    tabIndex={0}
                    aria-label={`Open partner profile for ${p.partnerName}`}
                    className="cursor-pointer"
                    onClick={() => navigate(`/partner/${p.partnerId}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/partner/${p.partnerId}`);
                      }
                    }}
                  >
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
        <div className="row g-4 admin-partners-grid">
          {visiblePartners.map((p, i) => (
            <div key={`${p.partnerId}-${i}`} className="col-sm-6 col-lg-4">
              <Link
                to={`/partner/${p.partnerId}`}
                className="admin-all-residents-card-link text-decoration-none text-reset d-block h-100"
                aria-label={`Open partner profile for ${p.partnerName}`}
              >
              <div className="admin-all-residents-card admin-partner-card--enhanced card h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title admin-partner-card__name mb-3">{p.partnerName}</h5>
                  <dl className="row small mb-0 flex-grow-1">
                    <dt className="col-5 text-muted fw-normal admin-partner-card__dt">Org type</dt>
                    <dd className="col-7 mb-2">
                      {p.organizationType ?? "\u2014"}
                    </dd>
                    <dt className="col-5 text-muted fw-normal admin-partner-card__dt">Role</dt>
                    <dd className="col-7 mb-2">{p.roleType ?? "\u2014"}</dd>
                    <dt className="col-5 text-muted fw-normal admin-partner-card__dt">Region</dt>
                    <dd className="col-7 mb-2">{p.region ?? "\u2014"}</dd>
                    <dt className="col-5 text-muted fw-normal admin-partner-card__dt">Status</dt>
                    <dd className="col-7 mb-2 admin-partner-card__status">{p.status ?? "\u2014"}</dd>
                    <dt className="col-5 text-muted fw-normal admin-partner-card__dt">Safehouse</dt>
                    <dd className="col-7 mb-2">
                      {p.assignedSafehouse ?? "\u2014"}
                    </dd>
                    <dt className="col-5 text-muted fw-normal admin-partner-card__dt">Start</dt>
                    <dd className="col-7 mb-0">
                      {p.startDate ? formatDate(p.startDate) : "\u2014"}
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

export default AdminAllPartnersPage;
