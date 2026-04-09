import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BASE_URL } from "../config/api";
import type { ResidentDetail, SafehousePartnerRow } from "../types/residentRecords";
import { dashIfEmpty, formatDate } from "../components/resident/residentRecordFormat";
import { EducationRecordsSection } from "../components/resident/EducationRecordsSection";
import { HealthRecordsSection } from "../components/resident/HealthRecordsSection";
import { MentalWellbeingRecordsSection } from "../components/resident/MentalWellbeingRecordsSection";
import { HomeVisitsRecordsSection } from "../components/resident/HomeVisitsRecordsSection";
import { IncidentReportsSection } from "../components/resident/IncidentReportsSection";

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

function parseDateOnlyLocal(iso: string): Date | null {
  const part = iso.split("T")[0];
  if (!part) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(part);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function getEighteenthBirthday(dob: Date): Date {
  return new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate());
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

type TransitionCountdown =
  | { kind: "no-dob" }
  | { kind: "past"; eighteenth: Date }
  | { kind: "today" }
  | { kind: "future"; days: number; eighteenth: Date };

function getTransitionCountdown(dateOfBirth?: string): TransitionCountdown {
  if (!dateOfBirth) return { kind: "no-dob" };
  const dob = parseDateOnlyLocal(dateOfBirth);
  if (!dob) return { kind: "no-dob" };
  const eighteenth = getEighteenthBirthday(dob);
  const today = startOfLocalDay(new Date());
  const target = startOfLocalDay(eighteenth);
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { kind: "past", eighteenth };
  if (days === 0) return { kind: "today" };
  return { kind: "future", days, eighteenth };
}

function riskAccentClass(level?: string): "high" | "medium" | "low" | "unknown" {
  const s = (level ?? "").trim().toLowerCase();
  if (!s) return "unknown";
  if (s.includes("high")) return "high";
  if (s.includes("medium") || s.includes("moderate")) return "medium";
  if (s.includes("low")) return "low";
  return "unknown";
}

function formatLocalDateMdY(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

function ResidentPage() {
  const { id } = useParams();
  const [resident, setResident] = useState<ResidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResident = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/Resident/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Resident not found");
      setResident(await res.json());
    } catch (err) {
      setError((err as Error).message);
      setResident(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadResident();
  }, [loadResident]);

  const refetchResidentQuiet = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${BASE_URL}/Resident/${id}`, { credentials: "include" });
      if (!res.ok) return;
      setResident(await res.json());
    } catch {
      /* keep existing data */
    }
  }, [id]);

  if (loading) {
    return (
      <div className="beacon-page beacon-page--loading text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !resident) {
    return (
      <div className="beacon-page container py-4">
        <div className="alert alert-danger">{error ?? "Resident not found."}</div>
      </div>
    );
  }

  const educationRecords = resident.educationRecords ?? [];
  const residentIdNum = Number(id);
  const healthWellbeingRecords = resident.healthWellbeingRecords ?? [];
  const processRecordings = resident.processRecordings ?? [];
  const homeVisitations = resident.homeVisitations ?? [];
  const incidentReports = resident.incidentReports ?? [];

  const dobDisplay = resident.dateOfBirth
    ? formatDate(resident.dateOfBirth)
    : "\u2014";
  const ageDisplay = resident.dateOfBirth
    ? String(calculateAge(resident.dateOfBirth))
    : "\u2014";

  const transition = getTransitionCountdown(resident.dateOfBirth);
  const riskAccent = riskAccentClass(resident.currentRiskLevel);
  const partners = resident.safehousePartners ?? [];

  return (
    <div className="beacon-page container py-4 resident-profile-page">
      <div className="mb-3">
        <Link to="/admin/all-residents" className="admin-dashboard-back">
          <i className="bi bi-arrow-left-short" aria-hidden="true" />
          <span>All residents</span>
        </Link>
      </div>
      <p className="landing-section__eyebrow mb-2">Resident</p>
      <div className="row g-4 align-items-start">
        <div className="col-lg-4 d-flex flex-column gap-3">
          <div className="card shadow-sm beacon-detail-card">
            <div className="card-body">
              <dl className="row small mb-0">
                <dt className="col-5 text-muted fw-normal">Name</dt>
                <dd className="col-7 mb-2">{dashIfEmpty(resident.name)}</dd>
                <dt className="col-5 text-muted fw-normal">Date of birth</dt>
                <dd className="col-7 mb-2">{dobDisplay}</dd>
                <dt className="col-5 text-muted fw-normal">Age</dt>
                <dd className="col-7 mb-2">{ageDisplay}</dd>
                <dt className="col-5 text-muted fw-normal">Sex</dt>
                <dd className="col-7 mb-2">{dashIfEmpty(resident.sex)}</dd>
                <dt className="col-5 text-muted fw-normal">Status</dt>
                <dd className="col-7 mb-0">{dashIfEmpty(resident.caseStatus)}</dd>
              </dl>
            </div>
          </div>

          <div className="card shadow-sm beacon-detail-card">
            <div className="card-body">
              <p className="landing-section__eyebrow mb-2">Safehouse</p>
              <p className="mb-0 fs-5 fw-semibold">{dashIfEmpty(resident.safehouseCity)}</p>
            </div>
          </div>
          <div className="card shadow-sm beacon-detail-card">
            <div className="card-body">
              <p className="landing-section__eyebrow mb-2">Time Housed</p>
              <p className="mb-0 fs-5 fw-semibold">{dashIfEmpty(resident.lengthOfStay)}</p>
            </div>
          </div>
          <div className="card shadow-sm beacon-detail-card">
            <div className="card-body">
              <p className="landing-section__eyebrow mb-2">Days Till 18</p>
              {transition.kind === "no-dob" ? (
                <p className="mb-0 fs-5 fw-semibold">{dashIfEmpty("")}</p>
              ) : transition.kind === "past" ? (
                <>
                  <p className="mb-1 fs-5 fw-semibold">Past transition age</p>
                  <p className="mb-0 small text-muted">
                    18th birthday was {formatLocalDateMdY(transition.eighteenth)}
                  </p>
                </>
              ) : transition.kind === "today" ? (
                <>
                  <p className="mb-1 fs-5 fw-semibold">Today</p>
                  <p className="mb-0 small text-muted">18th birthday — coordinate transition planning.</p>
                </>
              ) : (
                <>
                  <p className="mb-1 fs-5 fw-semibold">
                    {transition.days.toLocaleString()} day{transition.days === 1 ? "" : "s"}
                  </p>
                  <p className="mb-0 small text-muted">
                    Until {formatLocalDateMdY(transition.eighteenth)}
                  </p>
                </>
              )}
            </div>
          </div>
          <div
            className={`card shadow-sm beacon-detail-card resident-risk-card resident-risk-card--${riskAccent}`}
          >
            <div className="card-body">
              <p className="landing-section__eyebrow mb-2">Risk Level</p>
              <p className="mb-0 fs-5 fw-semibold">{dashIfEmpty(resident.currentRiskLevel)}</p>
            </div>
          </div>
          <div className="card shadow-sm beacon-detail-card">
            <div className="card-body">
              <p className="landing-section__eyebrow mb-2">Partner contacts</p>
              <p className="small text-muted mb-3">
                Active partners assigned to this safehouse — reach out for day-to-day coordination.
              </p>
              {partners.length === 0 ? (
                <p className="mb-0 small text-muted">No active partner assignments for this safehouse.</p>
              ) : (
                <ul className="list-unstyled mb-0 small resident-safehouse-partners">
                  {partners.map((p: SafehousePartnerRow, i: number) => (
                    <li key={`${p.partnerId}-${i}`} className="resident-safehouse-partners__item">
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                        <span className="fw-semibold">{dashIfEmpty(p.partnerName)}</span>
                        {p.isPrimary ? (
                          <span className="badge bg-primary rounded-pill">Primary</span>
                        ) : null}
                      </div>
                      {p.programArea ? (
                        <p className="mb-1 text-muted">{p.programArea}</p>
                      ) : null}
                      {p.contactName ? <p className="mb-1">{p.contactName}</p> : null}
                      {p.email ? (
                        <p className="mb-1">
                          <a href={`mailto:${p.email}`}>{p.email}</a>
                        </p>
                      ) : null}
                      {p.phone ? (
                        <p className="mb-0">
                          <a href={`tel:${p.phone.replace(/[^\d+]/g, "")}`}>{p.phone}</a>
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="row row-cols-1 row-cols-md-2 g-3 resident-record-sections-grid">
            <div className="col">
              <EducationRecordsSection
                records={educationRecords}
                residentId={residentIdNum}
                onEducationRecordsChanged={refetchResidentQuiet}
              />
            </div>
            <div className="col">
              <HealthRecordsSection
                records={healthWellbeingRecords}
                residentId={residentIdNum}
                onRecordsChanged={refetchResidentQuiet}
              />
            </div>
            <div className="col">
              <MentalWellbeingRecordsSection
                records={processRecordings}
                residentId={residentIdNum}
                onRecordsChanged={refetchResidentQuiet}
              />
            </div>
            <div className="col">
              <HomeVisitsRecordsSection
                records={homeVisitations}
                residentId={residentIdNum}
                onRecordsChanged={refetchResidentQuiet}
              />
            </div>
            <div className="col">
              <IncidentReportsSection
                records={incidentReports}
                residentId={residentIdNum}
                initialSafehouseId={resident.safehouseId}
                onRecordsChanged={refetchResidentQuiet}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResidentPage;
