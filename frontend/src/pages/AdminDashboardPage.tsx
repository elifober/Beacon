import { useState, type CSSProperties } from "react";
import SearchBar from "../components/SearchBar";
import { Link } from "react-router-dom";
import heroForestImage from "../assets/forrest.jpg";
import { fetchAdminOverviewStats, type AdminOverviewStats } from "../api/adminOverview";
import { useEffect } from "react";
import { AddEducationRecordModal } from "../components/resident/AddEducationRecordModal";
import { AddHealthRecordModal } from "../components/resident/AddHealthRecordModal";
import { AddProcessRecordingModal } from "../components/resident/AddProcessRecordingModal";
import { AddHomeVisitationModal } from "../components/resident/AddHomeVisitationModal";
import { AddIncidentReportModal } from "../components/resident/AddIncidentReportModal";
import {
  CreateResidentModal,
  CreatePartnerModal,
  CreateSafehouseModal,
} from "../components/admin/AdminCreateEntityModals";

const navLinks = [
  { to: "/admin/all-residents", label: "Residents" },
  { to: "/admin/all-safehouses", label: "Safehouses" },
  { to: "/admin/all-partners", label: "Partners" },
  { to: "/admin/all-donors", label: "Donors" },
  { to: "/admin/all-donations", label: "Donations" },
  { to: "/admin/risk", label: "Risk Center" },
  { to: "/admin/post-planner", label: "Post Planner" },
] as const;

type ResidentRecordModalKey =
  | "education"
  | "health"
  | "process"
  | "homeVisit"
  | "incident";

const addResidentRecordLinks: { key: ResidentRecordModalKey; label: string }[] = [
  { key: "education", label: "Add education record" },
  { key: "health", label: "Add health record" },
  { key: "process", label: "Add mental wellbeing record" },
  { key: "homeVisit", label: "Add home visit" },
  { key: "incident", label: "Add incident report" },
];

type AdminEntityModalKey = "resident" | "partner" | "safehouse";

const addProfileLinks: { key: AdminEntityModalKey; label: string }[] = [
  { key: "resident", label: "Add resident" },
  { key: "partner", label: "Add partner" },
  { key: "safehouse", label: "Add safehouse" },
];

function AdminDashboardPage() {
  const [residentRecordModal, setResidentRecordModal] = useState<ResidentRecordModalKey | null>(
    null,
  );
  const [adminEntityModal, setAdminEntityModal] = useState<AdminEntityModalKey | null>(null);
  const [adminHeroFallback, setAdminHeroFallback] = useState(false);
  const [overviewStats, setOverviewStats] = useState<AdminOverviewStats | null>(null);
  const [overviewError, setOverviewError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAdminOverviewStats()
      .then((s) => {
        if (cancelled) return;
        if (s) setOverviewStats(s);
        else setOverviewError(true);
      })
      .catch(() => {
        if (!cancelled) setOverviewError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  type NeedItem = { key: string; label: string; to: string };
  const needs: NeedItem[] = [];
  if (overviewStats) {
    if (overviewStats.unresolvedIncidents > 0) {
      needs.push({
        key: "incidents",
        label: `${overviewStats.unresolvedIncidents} unresolved incident${overviewStats.unresolvedIncidents === 1 ? "" : "s"}`,
        to: "/admin/risk",
      });
    }
    if (overviewStats.safehousesOverCapacity > 0) {
      needs.push({
        key: "capacity",
        label: `${overviewStats.safehousesOverCapacity} safehouse${overviewStats.safehousesOverCapacity === 1 ? "" : "s"} over capacity`,
        to: "/admin/all-safehouses",
      });
    }
    if (overviewStats.residentsMissingRiskLevel > 0) {
      needs.push({
        key: "risk",
        label: `${overviewStats.residentsMissingRiskLevel} resident${overviewStats.residentsMissingRiskLevel === 1 ? "" : "s"} missing risk level`,
        to: "/admin/all-residents",
      });
    }
  }
  const serviceMix = overviewStats
    ? [
        { label: "Residents", value: overviewStats.currentResidents, tone: "high" as const },
        { label: "Safehouses", value: overviewStats.activeSafehouses, tone: "medium" as const },
        { label: "Partners", value: overviewStats.totalPartners, tone: "low" as const },
        { label: "Supporters", value: overviewStats.totalSupporters, tone: "neutral" as const },
      ]
    : [];
  const attentionMix = overviewStats
    ? [
        {
          key: "incidents",
          label: "Unresolved incidents",
          to: "/admin/risk",
          value: overviewStats.unresolvedIncidents,
          tone: "low" as const,
        },
        {
          key: "capacity",
          label: "Over-capacity safehouses",
          to: "/admin/all-safehouses",
          value: overviewStats.safehousesOverCapacity,
          tone: "medium" as const,
        },
        {
          key: "risk",
          label: "Missing risk level",
          to: "/admin/all-residents",
          value: overviewStats.residentsMissingRiskLevel,
          tone: "high" as const,
        },
      ]
    : [];

  return (
    <div className="admin-dashboard beacon-page">
      <header className="admin-dashboard__hero" aria-label="Admin dashboard header">
        <img
          className="admin-dashboard__hero-img"
          src={adminHeroFallback ? heroForestImage : "/newadmindashboard.jpg"}
          alt=""
          decoding="async"
          onError={() => setAdminHeroFallback(true)}
        />
        <div className="admin-dashboard__hero-overlay" aria-hidden="true" />
        <div className="container admin-dashboard__hero-content">
          <p className="admin-dashboard__hero-eyebrow">Beacon admin</p>
          <h1 className="admin-dashboard__hero-title">Dashboard</h1>
        </div>
      </header>

      <section className="admin-dashboard__main">
        <div className="container">
          <div className="admin-dashboard__search-wrap">
            <SearchBar maxWidth={760} inputClassName="rounded-pill px-4 py-2" />
          </div>

          <div className="row g-4 align-items-stretch">
            <div className="col-lg-8">
              <div className="admin-dashboard__panel h-100">
                <p className="landing-section__eyebrow mb-2">Overview</p>
                <h2 className="landing-section__heading mb-3">At a glance</h2>

                {overviewStats ? (
                  <>
                    <div className="admin-overview__kpis" role="list" aria-label="Key metrics">
                      <Link to="/admin/all-residents" className="admin-kpi admin-kpi--link" role="listitem">
                        <div className="admin-kpi__value">{overviewStats.currentResidents}</div>
                        <div className="admin-kpi__label">Current residents</div>
                      </Link>
                      <Link to="/admin/all-safehouses" className="admin-kpi admin-kpi--link" role="listitem">
                        <div className="admin-kpi__value">{overviewStats.activeSafehouses}</div>
                        <div className="admin-kpi__label">Active safehouses</div>
                      </Link>
                      <Link to="/admin/all-residents" className="admin-kpi admin-kpi--link" role="listitem">
                        <div className="admin-kpi__value">{overviewStats.totalResidentsServed}</div>
                        <div className="admin-kpi__label">Residents served</div>
                      </Link>
                      <Link to="/admin/all-donors" className="admin-kpi admin-kpi--link" role="listitem">
                        <div className="admin-kpi__value">{overviewStats.totalSupporters}</div>
                        <div className="admin-kpi__label">Supporters</div>
                      </Link>
                      <Link to="/admin/all-partners" className="admin-kpi admin-kpi--link" role="listitem">
                        <div className="admin-kpi__value">{overviewStats.totalPartners}</div>
                        <div className="admin-kpi__label">Partners</div>
                      </Link>
                      <Link to="/admin/all-donations" className="admin-kpi admin-kpi--link" role="listitem">
                        <div className="admin-kpi__value">{overviewStats.donationsLast30Days}</div>
                        <div className="admin-kpi__label">Donations (30 days)</div>
                      </Link>
                    </div>

                    <div className="admin-overview__charts" aria-label="Overview charts">
                      <div className="admin-overview__chart-card">
                        <p className="admin-overview__chart-title">Service mix</p>
                        <div className="admin-overview__mix-layout">
                          <OverviewDonut items={serviceMix} />
                          <ul className="admin-overview__mix-legend">
                            {serviceMix.map((item) => (
                              <li key={item.label}>
                                <span className={`admin-overview__legend-dot admin-overview__legend-dot--${item.tone}`} />
                                <span>{item.label}</span>
                                <strong>{item.value}</strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="admin-overview__chart-card">
                        <p className="admin-overview__chart-title">Attention load</p>
                        <div className="admin-overview__attention-bar" role="img" aria-label="Needs attention distribution">
                          {attentionMix.map((item) => (
                            <Link
                              key={item.key}
                              to={item.to}
                              className={`admin-overview__attention-segment admin-overview__attention-segment--${item.tone}`}
                              style={{ width: `${Math.max(8, (item.value / Math.max(1, attentionMix.reduce((a, b) => a + b.value, 0))) * 100)}%` }}
                              title={`${item.label}: ${item.value}`}
                            >
                              <span>{item.value}</span>
                            </Link>
                          ))}
                        </div>
                        <ul className="admin-overview__attention-legend">
                          {attentionMix.map((item) => (
                            <li key={`${item.key}-legend`}>
                              <span className={`admin-overview__legend-dot admin-overview__legend-dot--${item.tone}`} />
                              <span>{item.label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="admin-overview__needs" aria-label="Needs attention">
                      <p className="admin-overview__needs-title">Needs attention</p>
                      {needs.length ? (
                        <ul className="admin-overview__needs-list">
                          {needs.map((n) => (
                            <li key={n.key}>
                              <Link to={n.to}>{n.label}</Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="admin-overview__needs-empty mb-0">All caught up.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="landing-section__body mb-0">
                    {overviewError
                      ? "Stats are unavailable right now (API not reachable or you may need to re-sign in). Use the links to manage residents, safehouses, partners, donors, and donations."
                      : "Loading overview stats…"}
                  </p>
                )}
              </div>
            </div>

            <div className="col-lg-4">
              <div className="admin-dashboard__nav-card">
                <p className="landing-section__eyebrow mb-3">Navigate</p>
                <nav className="admin-dashboard__nav" aria-label="Admin sections">
                  {navLinks.map(({ to, label }) => (
                    <Link key={to} to={to} className="admin-dashboard__nav-link">
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          <div className="row g-4 align-items-stretch mt-lg-2 mt-4">
            <div className="col-12">
              <div className="admin-dashboard__nav-card">
                <div className="admin-dashboard__actions-head">
                  <p className="landing-section__eyebrow mb-2">Quick actions</p>
                  <h3 className="admin-dashboard__actions-title">Create records and profiles</h3>
                  <p className="admin-dashboard__actions-subtitle mb-0">
                    Use these shortcuts to launch forms without leaving the dashboard.
                  </p>
                </div>
                <div className="row g-3 g-lg-4 mt-1">
                  <div className="col-12 col-lg-6">
                    <section className="admin-dashboard__action-group" aria-label="Resident records">
                      <p className="admin-dashboard__action-group-kicker mb-2">Resident records</p>
                      <p className="landing-section__body small text-muted mb-3">
                        Open a form to add education, health, home visit, wellbeing, or incident data.
                      </p>
                      <nav className="admin-dashboard__action-grid" aria-label="Add resident record">
                        {addResidentRecordLinks.map(({ key, label }) => (
                          <button
                            key={key}
                            type="button"
                            className="admin-dashboard__action-btn"
                            onClick={() => setResidentRecordModal(key)}
                          >
                            {label}
                          </button>
                        ))}
                      </nav>
                    </section>
                  </div>
                  <div className="col-12 col-lg-6 admin-dashboard__profiles-column">
                    <section className="admin-dashboard__action-group" aria-label="Profiles">
                      <p className="admin-dashboard__action-group-kicker mb-2">Profiles</p>
                      <p className="landing-section__body small text-muted mb-3">
                        Create new residents, partners, and safehouses. Donors are added via signup.
                      </p>
                      <nav className="admin-dashboard__action-grid" aria-label="Add profile or location">
                        {addProfileLinks.map(({ key, label }) => (
                          <button
                            key={key}
                            type="button"
                            className="admin-dashboard__action-btn"
                            onClick={() => setAdminEntityModal(key)}
                          >
                            {label}
                          </button>
                        ))}
                      </nav>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AddEducationRecordModal
        open={residentRecordModal === "education"}
        onClose={() => setResidentRecordModal(null)}
        onCreated={() => setResidentRecordModal(null)}
      />
      <AddHealthRecordModal
        open={residentRecordModal === "health"}
        onClose={() => setResidentRecordModal(null)}
        onCreated={() => setResidentRecordModal(null)}
      />
      <AddProcessRecordingModal
        open={residentRecordModal === "process"}
        onClose={() => setResidentRecordModal(null)}
        onCreated={() => setResidentRecordModal(null)}
      />
      <AddHomeVisitationModal
        open={residentRecordModal === "homeVisit"}
        onClose={() => setResidentRecordModal(null)}
        onCreated={() => setResidentRecordModal(null)}
      />
      <AddIncidentReportModal
        open={residentRecordModal === "incident"}
        onClose={() => setResidentRecordModal(null)}
        onCreated={() => setResidentRecordModal(null)}
      />
      <CreateResidentModal
        open={adminEntityModal === "resident"}
        onClose={() => setAdminEntityModal(null)}
        onSaved={() => setAdminEntityModal(null)}
      />
      <CreatePartnerModal
        open={adminEntityModal === "partner"}
        onClose={() => setAdminEntityModal(null)}
        onSaved={() => setAdminEntityModal(null)}
      />
      <CreateSafehouseModal
        open={adminEntityModal === "safehouse"}
        onClose={() => setAdminEntityModal(null)}
        onSaved={() => setAdminEntityModal(null)}
      />
    </div>
  );
}

function OverviewDonut({
  items,
}: {
  items: { label: string; value: number; tone: "high" | "medium" | "low" | "neutral" }[];
}) {
  const total = items.reduce((acc, item) => acc + item.value, 0);
  const [a = 0, b = 0, c = 0, d = 0] = items.map((item) =>
    total > 0 ? (item.value / total) * 100 : 0,
  );
  return (
    <div
      className="admin-overview__mix-donut"
      style={
        {
          "--mix-a": `${a}%`,
          "--mix-b": `${b}%`,
          "--mix-c": `${c}%`,
          "--mix-d": `${d}%`,
        } as CSSProperties
      }
      aria-label={`Service mix total ${total}`}
      role="img"
    >
      <div className="admin-overview__mix-center">
        <strong>{total}</strong>
        <span>Total</span>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
