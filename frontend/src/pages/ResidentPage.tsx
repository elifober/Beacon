import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BASE_URL } from "../config/api";
import type { ResidentDetail, SafehousePartnerRow } from "../types/residentRecords";
import { dashIfEmpty, formatDate } from "../components/resident/residentRecordFormat";
import { EducationRecordsSection } from "../components/resident/EducationRecordsSection";
import { HealthRecordsSection } from "../components/resident/HealthRecordsSection";
import { MentalWellbeingRecordsSection } from "../components/resident/MentalWellbeingRecordsSection";
import { HomeVisitsRecordsSection } from "../components/resident/HomeVisitsRecordsSection";
import { IncidentReportsSection } from "../components/resident/IncidentReportsSection";
import { AdminDeleteRecordButton } from "../components/admin/AdminDeleteRecordButton";
import { CreateResidentModal } from "../components/admin/AdminCreateEntityModals";
import type { ResidentInput } from "../api/Residents";
import BeaconLoadingMark from "../components/BeaconLoadingMark.tsx";

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

/** Sort key for ISO-ish record dates (date-only prefix preferred). */
function recordDateComparable(iso: string): number {
  const part = iso.split("T")[0] ?? "";
  const local = part ? parseDateOnlyLocal(part) : null;
  if (local) return local.getTime();
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/** Whole local days from session date to today (0 if today). */
function daysSinceMostRecentSession(sessionDateIso: string): number | null {
  const part = sessionDateIso.split("T")[0] ?? "";
  const sessionDay = part ? parseDateOnlyLocal(part) : parseDateOnlyLocal(sessionDateIso);
  if (!sessionDay) {
    const t = Date.parse(sessionDateIso);
    if (Number.isNaN(t)) return null;
    const normalized = startOfLocalDay(new Date(t));
    const today = startOfLocalDay(new Date());
    return Math.max(0, Math.round((today.getTime() - normalized.getTime()) / 86400000));
  }
  const today = startOfLocalDay(new Date());
  return Math.max(
    0,
    Math.round((today.getTime() - startOfLocalDay(sessionDay).getTime()) / 86400000),
  );
}

/** First line of value after `health status:` in notes (case-insensitive). */
function parseHealthStatusFromNotes(notes: string | undefined | null): string | null {
  if (notes == null) return null;
  const trimmed = notes.trim();
  if (!trimmed) return null;
  const m = /health\s*status\s*:\s*(.+)/i.exec(trimmed);
  if (!m) return null;
  const firstLine = m[1].split(/\n/)[0]?.trim() ?? "";
  return firstLine.replace(/\s+/g, " ") || null;
}

type ResidentQuickMetricsProps = {
  daysSinceTherapy: number | null;
  educationProgressPercent: number | null | undefined;
  healthStatusLabel: string | null;
};

function ResidentQuickMetricsSection({
  daysSinceTherapy,
  educationProgressPercent,
  healthStatusLabel,
}: ResidentQuickMetricsProps) {
  const therapyDisplay =
    daysSinceTherapy === null ? "\u2014" : String(daysSinceTherapy);
  const therapySub =
    daysSinceTherapy === null
      ? "No process / therapy sessions on file."
      : daysSinceTherapy === 0
        ? "Latest session is today."
        : daysSinceTherapy === 1
          ? "Since last session."
          : "Days since last session.";

  const progressDisplay =
    educationProgressPercent != null && !Number.isNaN(Number(educationProgressPercent))
      ? `${Math.round(Number(educationProgressPercent))}%`
      : "\u2014";
  const progressSub =
    educationProgressPercent != null && !Number.isNaN(Number(educationProgressPercent))
      ? "From most recent education record."
      : "No progress value on latest education record.";

  const healthDisplay = healthStatusLabel?.trim() ? healthStatusLabel.trim() : "\u2014";
  const healthSub =
    healthStatusLabel?.trim() ? "From most recent health & wellbeing notes." : "No parsed health status in latest record.";

  return (
    <div className="resident-profile-metrics">
      <p className="landing-section__eyebrow mb-3">Case metrics</p>
      <div className="row g-3 align-items-stretch">
        <div className="col-12 col-md-4">
          <div className="resident-metric-tile h-100" role="group" aria-label="Therapy session recency">
            <div className="resident-metric-tile__accent" aria-hidden="true" />
            <div className="resident-metric-tile__body">
              <p className="resident-metric-tile__label mb-1">Days since last therapy session</p>
              <p className="resident-metric-tile__value mb-0">{therapyDisplay}</p>
              <p className="resident-metric-tile__hint mb-0">{therapySub}</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="resident-metric-tile h-100" role="group" aria-label="Education progress">
            <div className="resident-metric-tile__accent" aria-hidden="true" />
            <div className="resident-metric-tile__body">
              <p className="resident-metric-tile__label mb-1">Education progress</p>
              <p className="resident-metric-tile__value mb-0">{progressDisplay}</p>
              <p className="resident-metric-tile__hint mb-0">{progressSub}</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="resident-metric-tile h-100" role="group" aria-label="Health status">
            <div className="resident-metric-tile__accent" aria-hidden="true" />
            <div className="resident-metric-tile__body">
              <p className="resident-metric-tile__label mb-1">Health status</p>
              <p className="resident-metric-tile__value resident-metric-tile__value--text mb-0">
                {healthDisplay}
              </p>
              <p className="resident-metric-tile__hint mb-0">{healthSub}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type FlagLine = { label: string; detail?: string };

function residentHouseholdFlagLines(r: ResidentDetail): FlagLine[] {
  const out: FlagLine[] = [];
  if (r.familyIs4ps === true) out.push({ label: "4P family" });
  if (r.familySoloParent === true) out.push({ label: "Solo parent" });
  if (r.familyIndigenous === true) out.push({ label: "Indigenous" });
  if (r.familyParentPwd === true) out.push({ label: "Parents with disability" });
  return out;
}

function residentClassificationFlagLines(r: ResidentDetail): FlagLine[] {
  const out: FlagLine[] = [];
  if (r.subCatOrphaned === true) out.push({ label: "Orphaned" });
  if (r.subCatTrafficked === true) out.push({ label: "Trafficked" });
  if (r.subCatChildLabor === true) out.push({ label: "Child labor" });
  if (r.subCatPhysicalAbuse === true) out.push({ label: "Physical abuse" });
  if (r.subCatSexualAbuse === true) out.push({ label: "Sexual abuse" });
  if (r.subCatOsaec === true) out.push({ label: "Online sexual abuse" });
  if (r.subCatCicl === true) out.push({ label: "Legal conflict" });
  if (r.subCatAtRisk === true) out.push({ label: "At risk" });
  if (r.subCatStreetChild === true) out.push({ label: "Street child" });
  if (r.subCatChildWithHiv === true) out.push({ label: "HIV" });
  if (r.isPwd === true) {
    const detail = r.pwdType?.trim();
    out.push({
      label: "Disability",
      ...(detail ? { detail } : {}),
    });
  }
  if (r.hasSpecialNeeds === true) {
    const detail = r.specialNeedsDiagnosis?.trim();
    out.push({
      label: "Special needs",
      ...(detail ? { detail } : {}),
    });
  }
  return out;
}

function ResidentFlagsBar({ resident }: { resident: ResidentDetail }) {
  const household = residentHouseholdFlagLines(resident);
  const classification = residentClassificationFlagLines(resident);
  const total = household.length + classification.length;
  const showHousehold = household.length > 0;
  const showClassification = classification.length > 0;

  return (
    <div className="card shadow-sm beacon-detail-card resident-profile-flags-bar">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-3">
          <h2 className="h5 mb-0 fw-semibold">Flags</h2>
          <p className="text-muted small mb-0">
            {total === 0 ? "No flags recorded" : `${total} active flag${total === 1 ? "" : "s"}`}
          </p>
        </div>

        {total === 0 ? (
          <p className="small text-muted mb-0">
            Intake flags will appear here when they are set on the resident record.
          </p>
        ) : (
          <div className="row g-3 g-md-4 small">
            {showHousehold ? (
              <div className={showClassification ? "col-md-6" : "col-12"}>
                <p className="landing-section__eyebrow mb-2">Household</p>
                <ul className="list-unstyled mb-0 resident-profile-flags d-flex flex-wrap gap-2">
                  {household.map(({ label, detail }) => (
                    <li key={label} className="mb-0">
                      <span className="badge bg-secondary rounded-pill">{label}</span>
                      {detail ? (
                        <span className="text-muted d-block mt-1 small">{detail}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {showClassification ? (
              <div className={showHousehold ? "col-md-6" : "col-12"}>
                <p className="landing-section__eyebrow mb-2">Classification</p>
                <ul className="list-unstyled mb-0 resident-profile-flags d-flex flex-wrap gap-2">
                  {classification.map(({ label, detail }) => (
                    <li key={`${label}-${detail ?? ""}`} className="mb-0">
                      <span className="badge bg-secondary rounded-pill">{label}</span>
                      {detail ? (
                        <span className="text-muted d-block mt-1 small">{detail}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function ResidentPage() {
  const { id } = useParams();
  const [resident, setResident] = useState<ResidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

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

  const residentEditInitial = useMemo((): Partial<ResidentInput> | null => {
    if (!resident || !id) return null;
    const sex =
      resident.sex === "M" || resident.sex === "F" ? resident.sex : "";
    const b = (v: boolean | null | undefined) => v === true;
    return {
      firstName: resident.firstName ?? "",
      lastInitial: resident.lastInitial ?? "",
      religion: resident.religion ?? "",
      caseCategory: resident.caseCategory ?? "",
      dateOfAdmission: resident.dateOfAdmission
        ? resident.dateOfAdmission.slice(0, 10)
        : "",
      caseControlNo: resident.caseControlNo ?? "",
      internalCode: resident.internalCode ?? "",
      safehouseId: resident.safehouseId ?? 0,
      caseStatus: resident.caseStatus ?? "",
      sex,
      dateOfBirth: resident.dateOfBirth
        ? resident.dateOfBirth.slice(0, 10)
        : "",
      initialRiskLevel: resident.initialRiskLevel ?? "",
      currentRiskLevel: resident.currentRiskLevel ?? "",
      birthStatus: resident.birthStatus ?? "",
      placeOfBirth: resident.placeOfBirth ?? "",
      familyIs4ps: b(resident.familyIs4ps),
      familySoloParent: b(resident.familySoloParent),
      familyIndigenous: b(resident.familyIndigenous),
      familyParentPwd: b(resident.familyParentPwd),
      subCatOrphaned: b(resident.subCatOrphaned),
      subCatTrafficked: b(resident.subCatTrafficked),
      subCatChildLabor: b(resident.subCatChildLabor),
      subCatPhysicalAbuse: b(resident.subCatPhysicalAbuse),
      subCatSexualAbuse: b(resident.subCatSexualAbuse),
      subCatOsaec: b(resident.subCatOsaec),
      subCatCicl: b(resident.subCatCicl),
      subCatAtRisk: b(resident.subCatAtRisk),
      subCatStreetChild: b(resident.subCatStreetChild),
      subCatChildWithHiv: b(resident.subCatChildWithHiv),
      isPwd: b(resident.isPwd),
      pwdType: resident.pwdType ?? "",
      hasSpecialNeeds: b(resident.hasSpecialNeeds),
      specialNeedsDiagnosis: resident.specialNeedsDiagnosis ?? "",
    };
  }, [resident, id]);

  if (loading) {
    return (
      <div className="beacon-page beacon-page--loading text-center">
        <BeaconLoadingMark />
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

  const sortedProcess = [...processRecordings].sort(
    (a, b) => recordDateComparable(b.sessionDate) - recordDateComparable(a.sessionDate),
  );
  const daysSinceTherapy =
    sortedProcess[0] != null
      ? daysSinceMostRecentSession(sortedProcess[0].sessionDate)
      : null;

  const sortedEducation = [...educationRecords].sort(
    (a, b) => recordDateComparable(b.recordDate) - recordDateComparable(a.recordDate),
  );
  const educationProgressPercent = sortedEducation[0]?.progressPercent;

  const sortedHealth = [...healthWellbeingRecords].sort(
    (a, b) => recordDateComparable(b.recordDate) - recordDateComparable(a.recordDate),
  );
  const healthStatusLabel = parseHealthStatusFromNotes(sortedHealth[0]?.notes);

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
      {residentEditInitial ? (
        <CreateResidentModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={() => void refetchResidentQuiet()}
          editResidentId={Number(id)}
          initialResident={residentEditInitial}
        />
      ) : null}
      <div className="mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <Link to="/admin/all-residents" className="admin-dashboard-back">
          <i className="bi bi-arrow-left-short" aria-hidden="true" />
          <span>All residents</span>
        </Link>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => setEditOpen(true)}
          >
            Edit resident
          </button>
          <AdminDeleteRecordButton
            entity="Resident"
            id={id}
            label="Delete resident"
            confirmMessage={`Permanently delete this resident and related case records (resident ID ${id})? This cannot be undone.`}
            redirectTo="/admin/all-residents"
          />
        </div>
      </div>
      <div className="row g-4 align-items-start">
        <aside className="col-lg-4 d-flex flex-column gap-3 resident-profile-sidebar">
          <div className="card shadow-sm beacon-detail-card">
            <div className="card-body">
              <p className="landing-section__eyebrow mb-2">Resident</p>
              <h1 className="h4 mb-3 resident-profile-page__name">{dashIfEmpty(resident.name)}</h1>
              <dl className="row small mb-0">
                <dt className="col-5 text-muted fw-normal">Date of birth</dt>
                <dd className="col-7 mb-2">{dobDisplay}</dd>
                <dt className="col-5 text-muted fw-normal">Age</dt>
                <dd className="col-7 mb-2">{ageDisplay}</dd>
                <dt className="col-5 text-muted fw-normal">Sex</dt>
                <dd className="col-7 mb-2">{dashIfEmpty(resident.sex)}</dd>
                <dt className="col-5 text-muted fw-normal">Case status</dt>
                <dd className="col-7 mb-0">{dashIfEmpty(resident.caseStatus)}</dd>
              </dl>
            </div>
          </div>

          <div className="card shadow-sm beacon-detail-card">
            <div className="card-body">
              <p className="landing-section__eyebrow mb-3">Placement</p>
              <dl className="row small mb-0">
                <dt className="col-5 text-muted fw-normal">Safehouse</dt>
                <dd className="col-7 mb-2">{dashIfEmpty(resident.safehouseCity)}</dd>
                <dt className="col-5 text-muted fw-normal">Time housed</dt>
                <dd className="col-7 mb-0">{dashIfEmpty(resident.lengthOfStay)}</dd>
              </dl>
            </div>
          </div>

          <div className="card shadow-sm beacon-detail-card">
            <div className="card-body">
              <p className="landing-section__eyebrow mb-3">Transition &amp; risk</p>
              <div className="resident-profile-page__planning-block">
                <p className="small fw-semibold text-muted mb-2">Days until 18</p>
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
              <div
                className={`resident-risk-card resident-risk-card--nested resident-risk-card--${riskAccent}`}
              >
                <p className="landing-section__eyebrow mb-2">Risk level</p>
                <p className="mb-0 fs-5 fw-semibold">{dashIfEmpty(resident.currentRiskLevel)}</p>
              </div>
            </div>
          </div>

          <div className="card shadow-sm beacon-detail-card">
            <div className="card-body">
              <p className="landing-section__eyebrow mb-2">Partner contacts</p>
              <p className="small text-muted mb-3">
                Active partners for this safehouse — use for coordination.
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
        </aside>

        <div className="col-lg-8 resident-profile-main">
          <ResidentQuickMetricsSection
            daysSinceTherapy={daysSinceTherapy}
            educationProgressPercent={educationProgressPercent}
            healthStatusLabel={healthStatusLabel}
          />

          <ResidentFlagsBar resident={resident} />

          <p className="landing-section__eyebrow mb-3 mt-1">Case records</p>
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
