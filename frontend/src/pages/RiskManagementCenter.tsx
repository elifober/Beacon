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

type Tab = "residents-incident" | "residents-reintegration" | "supporters";

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
  const [tab, setTab] = useState<Tab>("residents-incident");
  const [incidentPage, setIncidentPage] = useState(1);
  const [reintegrationPage, setReintegrationPage] = useState(1);
  const [supporterPage, setSupporterPage] = useState(1);
  const pageSize = 15;

    // Reset to page 1 when switching tabs
  useEffect(() => {
    setIncidentPage(1);
    setReintegrationPage(1);
    setSupporterPage(1);
    }, [tab]);

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

  if (loading) {
    return (
      <div className="beacon-page beacon-page--loading text-center admin-list-page">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
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

  const countFor = (
    list: { band?: string; tier?: string; count: number }[] | undefined,
    label: string,
  ) =>
    list?.find(
      (x) => (x.band ?? x.tier ?? "").toLowerCase() === label.toLowerCase(),
    )?.count ?? 0;

  return (
    <div className="beacon-page container py-4 admin-list-page">
      <AdminDashboardBackLink />
      {/* Centered header */}
      <div className="row justify-content-center text-center mb-4">
        <div className="col-lg-8">
          <p className="landing-section__eyebrow mb-2">Admin</p>
          <h1>Risk Management Center</h1>
          <p className="post-planner__lead mb-0">
            Predictive risk scores for residents and supporters, powered by
            the Beacon ML pipelines.
          </p>
        </div>
      </div>
      <div className="text-center mb-4">
        <Link to="/admin/post-planner" className="btn btn-primary btn-sm">
          Open Post Planner
        </Link>
      </div>

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        <SummaryCard
            label="High incident risk residents"
            value={countFor(summary?.residentIncidentBands, "High")}
            tone="low"
        />
        <SummaryCard
            label="Residents ready for reintegration"
            value={countFor(summary?.residentReintegrationBands, "Ready")}
            tone="high"
        />
        <SummaryCard
            label="High churn risk supporters"
            value={countFor(summary?.supporterChurnTiers, "High")}
            tone="low"
        />
        <SummaryCard
            label="Low churn risk supporters"
            value={countFor(summary?.supporterChurnTiers, "Low")}
            tone="high"
        />
      </div>

      {/* Tab switcher */}
      <div className="btn-group btn-group-sm flex-wrap mb-3 w-100 w-md-auto" role="tablist">
        <button
          className={`btn ${tab === "residents-incident" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setTab("residents-incident")}
        >
          Incident risk
        </button>
        <button
          className={`btn ${tab === "residents-reintegration" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setTab("residents-reintegration")}
        >
          Reintegration
        </button>
        <button
          className={`btn ${tab === "supporters" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setTab("supporters")}
        >
          Supporter Churn
        </button>
      </div>

      {/* Tables */}
      {tab === "residents-incident" && (
        <div className="card beacon-detail-card">
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
                {residentsByIncident
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
            totalCount={residentsByIncident.length}
            onPageChange={setIncidentPage}
            className="mt-4"
            />
        </div>
      )}

      {tab === "residents-reintegration" && (
        <div className="card beacon-detail-card">
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
                {residentsByReintegration
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
            totalCount={residentsByReintegration.length}
            onPageChange={setReintegrationPage}
            className="mt-4"
            />
        </div>
      )}

      {tab === "supporters" && (
        <div className="card beacon-detail-card">
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
                {supportersByChurn
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
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "high" | "medium" | "low";
}) {
  return (
    <div className="col-sm-6 col-lg-3">
      <div className="card h-100 shadow-sm admin-hub-summary-card">
        <div className="card-body">
          <p className="landing-section__eyebrow mb-2">{label}</p>
          <div className={`post-planner__score post-planner__gauge--${tone}`}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}
