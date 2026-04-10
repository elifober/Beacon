import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getResidentRisks,
  getSupporterRisks,
  getRiskSummary,
  type ResidentRisk,
  type SupporterRisk,
  type RiskSummary,
} from "../api/Risk";
import AdminDashboardBackLink from "../components/AdminDashboardBackLink";
import Pagination from "../components/Pagination";
import BeaconLoadingMark from "../components/BeaconLoadingMark.tsx";
import heroForestImage from "../assets/forrest.jpg";

type Tab = "residents-incident" | "residents-reintegration" | "supporters";
type QuickFilter = "incident-high" | "reintegration-ready" | "supporter-high" | "supporter-low" | null;
type BandCount = { label: string; count: number; tone: "high" | "medium" | "low"; onClick?: () => void };

function tierTone(band: string | null | undefined): "high" | "medium" | "low" {
  const b = (band ?? "").toLowerCase();
  // NOTE: post-planner classes use high=green, low=red. For risk language we
  // invert so "High risk / Not Ready / High churn" render red, and the
  // positive states render green.
  if (b.includes("high") || b.includes("not ready")) return "low";
  if (b.includes("medium") || b.includes("developing")) return "medium";
  return "high";
}


function pct(v: number | null): string {
  if (v == null) return "—";
  return `${(v * 100).toFixed(0)}%`;
}

function TierBadge({ label }: { label: string | null }) {
  if (!label) return <span>—</span>;
  const tone = tierTone(label);
  return (
    <span className={`post-planner__badge post-planner__badge--${tone}`}>
      {label}
    </span>
  );
}

export default function RiskManagementCenter() {
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [residents, setResidents] = useState<ResidentRisk[]>([]);
  const [supporters, setSupporters] = useState<SupporterRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroFallback, setHeroFallback] = useState(false);
  const [tab, setTab] = useState<Tab>("residents-incident");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);
  const [incidentPage, setIncidentPage] = useState(1);
  const [reintegrationPage, setReintegrationPage] = useState(1);
  const [supporterPage, setSupporterPage] = useState(1);
  const pageSize = 15;

    // Reset to page 1 when switching tabs
  useEffect(() => {
    setIncidentPage(1);
    setReintegrationPage(1);
    setSupporterPage(1);
  }, [tab, quickFilter]);

  useEffect(() => {
    Promise.all([getRiskSummary(), getResidentRisks(), getSupporterRisks()])
      .then(([s, r, sup]) => {
        setSummary(s);
        setResidents(r);
        setSupporters(sup);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const residentsByIncident = useMemo(
    () =>
      [...residents].sort(
        (a, b) => (b.incidentRiskScore ?? 0) - (a.incidentRiskScore ?? 0),
      ),
    [residents],
  );

  const residentsByReintegration = useMemo(
    () =>
      [...residents].sort(
        (a, b) => (b.reintegrationScore ?? 0) - (a.reintegrationScore ?? 0),
      ),
    [residents],
  );

  const supportersByChurn = useMemo(
    () =>
      [...supporters].sort(
        (a, b) => (b.churnProbability ?? 0) - (a.churnProbability ?? 0),
      ),
    [supporters],
  );

  const residentsIncidentDisplay = useMemo(() => {
    if (quickFilter !== "incident-high") return residentsByIncident;
    return residentsByIncident.filter((r) => (r.incidentRiskBand ?? "").toLowerCase() === "high");
  }, [quickFilter, residentsByIncident]);

  const residentsReintegrationDisplay = useMemo(() => {
    if (quickFilter !== "reintegration-ready") return residentsByReintegration;
    return residentsByReintegration.filter((r) => (r.reintegrationBand ?? "").toLowerCase() === "ready");
  }, [quickFilter, residentsByReintegration]);

  const supportersDisplay = useMemo(() => {
    if (quickFilter === "supporter-high") {
      return supportersByChurn.filter((s) => (s.riskTier ?? "").toLowerCase() === "high");
    }
    if (quickFilter === "supporter-low") {
      return supportersByChurn.filter((s) => (s.riskTier ?? "").toLowerCase() === "low");
    }
    return supportersByChurn;
  }, [quickFilter, supportersByChurn]);

  const jumpToFilter = (targetTab: Tab, targetFilter: QuickFilter) => {
    setTab(targetTab);
    setQuickFilter(targetFilter);
  };

  if (loading) {
    return (
      <div className="beacon-page beacon-page--loading text-center admin-list-page">
        <BeaconLoadingMark label="Loading" />
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

  const countFor = (
    list: { band?: string; tier?: string; count: number }[] | undefined,
    label: string,
  ) =>
    list?.find(
      (x) => (x.band ?? x.tier ?? "").toLowerCase() === label.toLowerCase(),
    )?.count ?? 0;

  return (
    <div className="admin-dashboard beacon-page">
      <header className="admin-dashboard__hero" aria-label="Risk management header">
        <img
          className="admin-dashboard__hero-img"
          src={heroFallback ? heroForestImage : "/riskcenter.jpg"}
          alt=""
          decoding="async"
          onError={() => setHeroFallback(true)}
        />
        <div className="admin-dashboard__hero-overlay" aria-hidden="true" />
        <div className="container admin-dashboard__hero-content">
          <p className="admin-dashboard__hero-eyebrow">Admin</p>
          <h1 className="admin-dashboard__hero-title">Risk Management Center</h1>
          <p className="post-planner__lead admin-dashboard__hero-subtitle mb-0" style={{ color: "rgba(242, 244, 240, 0.88)" }}>
            Predictive risk scores for residents and supporters, powered by the Beacon ML pipelines.
          </p>
        </div>
      </header>

      <section className="admin-dashboard__main">
        <div className="container">
          <div className="mb-4">
            <AdminDashboardBackLink />
          </div>

          {/* Summary cards */}
          <div className="row g-3 mb-4">
            <SummaryCard
              label="High incident risk residents"
              value={countFor(summary?.residentIncidentBands, "High")}
              tone="low"
              onClick={() => jumpToFilter("residents-incident", "incident-high")}
            />
            <SummaryCard
              label="Residents ready for reintegration"
              value={countFor(summary?.residentReintegrationBands, "Ready")}
              tone="high"
              onClick={() => jumpToFilter("residents-reintegration", "reintegration-ready")}
            />
            <SummaryCard
              label="High churn risk supporters"
              value={countFor(summary?.supporterChurnTiers, "High")}
              tone="low"
              onClick={() => jumpToFilter("supporters", "supporter-high")}
            />
            <SummaryCard
              label="Low churn risk supporters"
              value={countFor(summary?.supporterChurnTiers, "Low")}
              tone="high"
              onClick={() => jumpToFilter("supporters", "supporter-low")}
            />
          </div>

          <div className="card beacon-detail-card risk-distribution-card mb-4">
            <div className="card-body">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
                <h3 className="risk-distribution__title mb-0">Risk distribution snapshot</h3>
                <span className="risk-distribution__hint">Click a segment to drill into that group</span>
              </div>

              <StackedBandRow
                label="Incident risk (residents)"
                bands={[
                  {
                    label: "High",
                    count: countFor(summary?.residentIncidentBands, "High"),
                    tone: "low",
                    onClick: () => jumpToFilter("residents-incident", "incident-high"),
                  },
                  { label: "Medium", count: countFor(summary?.residentIncidentBands, "Medium"), tone: "medium" },
                  { label: "Low", count: countFor(summary?.residentIncidentBands, "Low"), tone: "high" },
                ]}
              />

              <StackedBandRow
                label="Reintegration readiness (residents)"
                bands={[
                  {
                    label: "Ready",
                    count: countFor(summary?.residentReintegrationBands, "Ready"),
                    tone: "high",
                    onClick: () => jumpToFilter("residents-reintegration", "reintegration-ready"),
                  },
                  { label: "Developing", count: countFor(summary?.residentReintegrationBands, "Developing"), tone: "medium" },
                  { label: "Not ready", count: countFor(summary?.residentReintegrationBands, "Not Ready"), tone: "low" },
                ]}
              />

              <StackedBandRow
                label="Supporter churn risk"
                bands={[
                  {
                    label: "High",
                    count: countFor(summary?.supporterChurnTiers, "High"),
                    tone: "low",
                    onClick: () => jumpToFilter("supporters", "supporter-high"),
                  },
                  { label: "Medium", count: countFor(summary?.supporterChurnTiers, "Medium"), tone: "medium" },
                  {
                    label: "Low",
                    count: countFor(summary?.supporterChurnTiers, "Low"),
                    tone: "high",
                    onClick: () => jumpToFilter("supporters", "supporter-low"),
                  },
                ]}
              />
            </div>
          </div>

          {quickFilter ? (
            <div className="mb-3">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setQuickFilter(null)}
              >
                Show all
              </button>
            </div>
          ) : null}

          {/* Tab switcher */}
          <div className="risk-tabs mb-3" role="tablist" aria-label="Risk view tabs">
        <button
          className={`risk-tabs__btn ${tab === "residents-incident" ? "risk-tabs__btn--active" : ""}`}
          onClick={() => setTab("residents-incident")}
        >
          Incident risk
        </button>
        <button
          className={`risk-tabs__btn ${tab === "residents-reintegration" ? "risk-tabs__btn--active" : ""}`}
          onClick={() => setTab("residents-reintegration")}
        >
          Reintegration
        </button>
        <button
          className={`risk-tabs__btn ${tab === "supporters" ? "risk-tabs__btn--active" : ""}`}
          onClick={() => setTab("supporters")}
        >
          Supporter Churn
        </button>
      </div>

      {/* Tables */}
      {tab === "residents-incident" && (
        <div className="card beacon-detail-card risk-center-table-card">
          <div className="card-body table-responsive">
            <table className="table table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Resident</th>
                  <th>Safehouse</th>
                  <th>Case status</th>
                  <th className="text-end">Incident risk</th>
                  <th>Tier</th>
                </tr>
              </thead>
              <tbody>
                {residentsIncidentDisplay
                    .slice((incidentPage - 1) * pageSize, incidentPage * pageSize)
                    .map((r) => (
                  <tr key={r.residentId}>
                    <td>
                      <Link to={`/resident/${r.residentId}`}>{r.name}</Link>
                    </td>
                    <td>{r.safehouseCity ?? "—"}</td>
                    <td>{r.caseStatus ?? "—"}</td>
                    <td className="text-end">{pct(r.incidentRiskScore)}</td>
                    <td><TierBadge label={r.incidentRiskBand} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={incidentPage}
            pageSize={pageSize}
            totalCount={residentsIncidentDisplay.length}
            onPageChange={setIncidentPage}
            className="mt-3 d-flex justify-content-center"
            />
        </div>
      )}

      {tab === "residents-reintegration" && (
        <div className="card beacon-detail-card risk-center-table-card">
          <div className="card-body table-responsive">
            <table className="table table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Resident</th>
                  <th>Safehouse</th>
                  <th>Case status</th>
                  <th className="text-end">Readiness</th>
                  <th>Tier</th>
                </tr>
              </thead>
              <tbody>
                {residentsReintegrationDisplay
                    .slice((reintegrationPage - 1) * pageSize, reintegrationPage * pageSize)
                    .map((r) => (
                  <tr key={r.residentId}>
                    <td>
                      <Link to={`/resident/${r.residentId}`}>{r.name}</Link>
                    </td>
                    <td>{r.safehouseCity ?? "—"}</td>
                    <td>{r.caseStatus ?? "—"}</td>
                    <td className="text-end">{pct(r.reintegrationScore)}</td>
                    <td><TierBadge label={r.reintegrationBand} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={reintegrationPage}
            pageSize={pageSize}
            totalCount={residentsReintegrationDisplay.length}
            onPageChange={setReintegrationPage}
            className="mt-3 d-flex justify-content-center"
            />
        </div>
      )}

      {tab === "supporters" && (
        <div className="card beacon-detail-card risk-center-table-card">
          <div className="card-body table-responsive">
            <table className="table table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Supporter</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="text-end">Churn probability</th>
                  <th>Tier</th>
                </tr>
              </thead>
              <tbody>
                {supportersDisplay
                    .slice((supporterPage - 1) * pageSize, supporterPage * pageSize)
                    .map((s) => (
                  <tr key={s.supporterId}>
                    <td>
                       <Link to={`/donor/${s.supporterId}`}>{s.name}</Link>
                    </td>
                    <td>{s.supporterType ?? "—"}</td>
                    <td>{s.status ?? "—"}</td>
                    <td className="text-end">{pct(s.churnProbability)}</td>
                    <td><TierBadge label={s.riskTier} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={supporterPage}
            pageSize={pageSize}
            totalCount={supportersDisplay.length}
            onPageChange={setSupporterPage}
            className="mt-3 d-flex justify-content-center"
          />
        </div>
      )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  tone: "high" | "medium" | "low";
  onClick: () => void;
}) {
  return (
    <div className="col-sm-6 col-lg-3">
      <button
        type="button"
        onClick={onClick}
        className="card h-100 shadow-sm admin-hub-summary-card risk-summary-card-btn text-start w-100"
      >
        <div className="card-body">
          <p className="landing-section__eyebrow mb-2">{label}</p>
          <div className={`post-planner__score post-planner__gauge--${tone}`}>
            {value}
          </div>
        </div>
      </button>
    </div>
  );
}

function StackedBandRow({ label, bands }: { label: string; bands: BandCount[] }) {
  const total = bands.reduce((acc, b) => acc + b.count, 0);
  return (
    <div className="risk-distribution__row">
      <div className="risk-distribution__label">{label}</div>
      <div className="risk-distribution__stack" role="img" aria-label={`${label}: ${bands.map((b) => `${b.label} ${b.count}`).join(", ")}`}>
        {bands.map((b) => {
          const pct = total > 0 ? (b.count / total) * 100 : 0;
          return (
            <button
              key={b.label}
              type="button"
              className={`risk-distribution__segment risk-distribution__segment--${b.tone} ${b.onClick ? "risk-distribution__segment--clickable" : ""}`}
              style={{ width: `${Math.max(pct, 4)}%` }}
              onClick={b.onClick}
              disabled={!b.onClick || b.count === 0}
              title={`${b.label}: ${b.count}`}
            >
              <span>{b.label} {b.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
