import { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "../config/api";
import Pagination from "../components/Pagination";
import AdminSearchInput from "../components/AdminSearchInput";
import AdminDashboardBackLink from "../components/AdminDashboardBackLink";
import AdminGlassFilterBar, {
  type AdminGlassFilterChoice,
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

/** Buckets by how long ago the donation date was */
function donationRecencyBucket(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "unknown";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days < 0) return "future";
  if (days <= 30) return "30d";
  if (days <= 90) return "90d";
  if (days <= 365) return "365d";
  return "older";
}

const DONATION_WHEN_CHOICES: AdminGlassFilterChoice[] = [
  { value: "30d", title: "Last 30 days" },
  { value: "90d", title: "Last 90 days" },
  { value: "365d", title: "Last 12 months" },
  { value: "older", title: "Older than 1 year" },
  { value: "future", title: "Future-dated" },
  { value: "unknown", title: "Invalid date" },
];

const DONATION_RECURRING_CHOICES: AdminGlassFilterChoice[] = [
  { value: "yes", title: "Recurring" },
  { value: "no", title: "One-time" },
];

interface AdminDonation {
  donationId: number;
  supporterName?: string;
  donationType?: string;
  donationDate: string;
  isRecurring?: boolean;
  amount?: number;
  estimatedValue?: number;
  impactUnit?: string;
  programArea?: string;
  notes?: string;
}

function formatAmount(d: AdminDonation): string {
  const isMonetary = d.donationType?.toLowerCase() === "monetary";
  if (isMonetary && d.amount != null) {
    return `₱${d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }
  if (!isMonetary && d.estimatedValue != null) {
    const val = d.estimatedValue.toLocaleString();
    return d.impactUnit ? `${val} ${d.impactUnit}` : val;
  }
  if (d.amount != null) {
    return `₱${d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }
  if (d.estimatedValue != null) {
    const val = d.estimatedValue.toLocaleString();
    return d.impactUnit ? `${val} ${d.impactUnit}` : val;
  }
  return "—";
}

function AdminAllDonationsPage() {
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const { query } = useAdminSearch();
  const [openFilterMenu, setOpenFilterMenu] = useState<string | null>(null);
  const [listFilters, setListFilters] = useState({
    type: "",
    program: "",
    recurring: "",
    when: "",
  });
  const [heroFallback, setHeroFallback] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/AllDonations`, { credentials: "include" })
      .then((res) => res.json())
      .then(setDonations)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const typeOptions = useMemo(
    () => uniqueField(donations, (d) => d.donationType),
    [donations],
  );
  const programOptions = useMemo(
    () => uniqueField(donations, (d) => d.programArea),
    [donations],
  );

  const donationsGlassSections = useMemo<AdminGlassFilterSection[]>(
    () => [
      {
        id: "type",
        tabLabel: "Type",
        allOption: { title: "All types" },
        choices: typeOptions.map((v) => ({
          value: v,
          title: v,
        })),
      },
      {
        id: "program",
        tabLabel: "Program",
        allOption: { title: "All program areas" },
        choices: programOptions.map((v) => ({
          value: v,
          title: v,
        })),
      },
      {
        id: "recurring",
        tabLabel: "Recurring",
        allOption: {
          title: "All gifts",
        },
        choices: DONATION_RECURRING_CHOICES,
      },
      {
        id: "when",
        tabLabel: "When",
        allOption: { title: "Any time" },
        choices: DONATION_WHEN_CHOICES,
      },
    ],
    [typeOptions, programOptions],
  );

  const filteredDonations = useMemo(
    () =>
      donations.filter((donation) => {
        if (normalizedQuery) {
          const matchesSearch = [
            donation.supporterName,
            donation.donationType,
            donation.programArea,
            donation.notes,
            String(donation.donationId),
            donation.isRecurring ? "recurring yes" : "one-time",
          ]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(normalizedQuery),
            );
          if (!matchesSearch) return false;
        }

        if (
          listFilters.type &&
          (donation.donationType?.trim() ?? "") !== listFilters.type
        ) {
          return false;
        }
        if (
          listFilters.program &&
          (donation.programArea?.trim() ?? "") !== listFilters.program
        ) {
          return false;
        }
        if (listFilters.recurring === "yes" && !donation.isRecurring) {
          return false;
        }
        if (listFilters.recurring === "no" && donation.isRecurring) {
          return false;
        }
        if (listFilters.when) {
          if (
            donationRecencyBucket(donation.donationDate) !== listFilters.when
          ) {
            return false;
          }
        }

        return true;
      }),
    [donations, normalizedQuery, listFilters],
  );

  useEffect(() => {
    setPage(1);
  }, [normalizedQuery, listFilters]);

  const totalCount = filteredDonations.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleDonations = filteredDonations.slice(
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
      <header className="admin-dashboard__hero" aria-label="Donations header">
        <img
          className="admin-dashboard__hero-img"
          src={heroFallback ? heroForestImage : "/doantions_page.jpg"}
          alt=""
          decoding="async"
          onError={() => setHeroFallback(true)}
        />
        <div className="admin-dashboard__hero-overlay" aria-hidden="true" />
        <div className="container admin-dashboard__hero-content">
          <p className="admin-dashboard__hero-eyebrow">Admin</p>
          <h1 className="admin-dashboard__hero-title">All Donations</h1>
          <p className="post-planner__lead admin-dashboard__hero-subtitle mb-0" style={{ color: "rgba(242, 244, 240, 0.88)" }}>
            Monitor donations by type, program area, and recurring patterns.
          </p>
        </div>
      </header>

      <section className="admin-dashboard__main">
        <div className="container">
          <AdminDashboardBackLink />
          <AdminSearchInput placeholder="Search donations by supporter, type, area, or notes..." />

          <AdminGlassFilterBar
            ariaLabel="Filter donations"
            openMenu={openFilterMenu}
            setOpenMenu={setOpenFilterMenu}
            values={listFilters}
            onValueChange={(sectionId, value) =>
              setListFilters((prev) => ({ ...prev, [sectionId]: value }))
            }
            sections={donationsGlassSections}
          />

          <div className="card beacon-detail-card donations-table-card">
            <div className="card-body table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Supporter</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Recurring</th>
                    <th>Amount</th>
                    <th>Program Area</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDonations.map((d, i) => (
                    <tr key={`${d.donationId}-${i}`}>
                      <td>{d.donationId}</td>
                      <td>{d.supporterName ?? "—"}</td>
                      <td>{d.donationType ?? "—"}</td>
                      <td>{formatDate(d.donationDate)}</td>
                      <td>{d.isRecurring ? "Yes" : "No"}</td>
                      <td>{formatAmount(d)}</td>
                      <td>{d.programArea ?? "—"}</td>
                      <td>{d.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            className="mt-3 d-flex justify-content-center"
          />
        </div>
      </section>
    </div>
  );
}

export default AdminAllDonationsPage;
