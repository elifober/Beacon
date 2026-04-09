import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../config/api";

function formatDate(dateStr: string | undefined | null): string {
  if (dateStr == null || dateStr === "") return "\u2014";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

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

function dashIfEmpty(value: string | null | undefined): string {
  if (value == null || String(value).trim() === "") return "\u2014";
  return value;
}

function fmtNum(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return "\u2014";
  return Number.isInteger(n) ? String(n) : n.toFixed(digits);
}

function fmtBool(b: boolean | null | undefined): string {
  if (b == null) return "\u2014";
  return b ? "Yes" : "No";
}

function clip(text: string | null | undefined, max = 120): string {
  if (text == null || text === "") return "\u2014";
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}\u2026`;
}

interface EducationRecordRow {
  educationRecordId: number;
  recordDate: string;
  educationLevel?: string;
  schoolName?: string;
  enrollmentStatus?: string;
  attendanceRate?: number;
  progressPercent?: number;
  completionStatus?: string;
  notes?: string;
}

interface HealthWellbeingRow {
  healthRecordId: number;
  recordDate: string;
  generalHealthScore?: number;
  nutritionScore?: number;
  sleepQualityScore?: number;
  energyLevelScore?: number;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  medicalCheckupDone?: boolean;
  dentalCheckupDone?: boolean;
  psychologicalCheckupDone?: boolean;
  notes?: string;
}

interface ProcessRecordingRow {
  recordingId: number;
  sessionDate: string;
  socialWorker?: string;
  sessionType?: string;
  sessionDurationMinutes?: number;
  emotionalStateObserved?: string;
  emotionalStateEnd?: string;
  interventionsApplied?: string;
  followUpActions?: string;
  progressNoted?: boolean;
  concernsFlagged?: boolean;
  referralMade?: boolean;
  sessionNarrative?: string;
  notesRestricted?: string;
}

interface HomeVisitationRow {
  visitationId: number;
  visitDate: string;
  socialWorker?: string;
  visitType?: string;
  locationVisited?: string;
  purpose?: string;
  observations?: string;
  familyCooperationLevel?: string;
  safetyConcernsNoted?: boolean;
  followUpNeeded?: boolean;
  followUpNotes?: string;
  visitOutcome?: string;
}

interface IncidentReportRow {
  incidentId: number;
  incidentDate: string;
  incidentType?: string;
  severity?: string;
  description?: string;
  responseTaken?: string;
  resolved?: boolean;
  resolutionDate?: string;
  reportedBy?: string;
  followUpRequired?: boolean;
  safehouseName?: string;
}

interface ResidentDetail {
  name: string;
  dateOfBirth?: string;
  sex?: string;
  caseStatus?: string;
  safehouseCity?: string;
  lengthOfStay?: string;
  currentRiskLevel?: string;
  educationRecords?: EducationRecordRow[];
  healthWellbeingRecords?: HealthWellbeingRow[];
  processRecordings?: ProcessRecordingRow[];
  homeVisitations?: HomeVisitationRow[];
  incidentReports?: IncidentReportRow[];
}

function RecordAccordion({
  sectionId,
  title,
  count,
  isOpen,
  onToggle,
  children,
}: {
  sectionId: string;
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="accordion-item resident-record-accordion border rounded mb-2 overflow-hidden">
      <h2 className="accordion-header m-0" id={`${sectionId}-heading`}>
        <button
          type="button"
          className={`accordion-button fw-semibold ${isOpen ? "" : "collapsed"}`}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`${sectionId}-panel`}
          id={`${sectionId}-trigger`}
        >
          <span className="d-flex w-100 align-items-center justify-content-between gap-2 pe-2">
            <span>{title}</span>
            <span className="badge bg-secondary rounded-pill flex-shrink-0">{count}</span>
          </span>
        </button>
      </h2>
      <div
        id={`${sectionId}-panel`}
        role="region"
        aria-labelledby={`${sectionId}-trigger`}
        className={`accordion-collapse collapse ${isOpen ? "show" : ""}`}
      >
        <div className="accordion-body p-0 border-top">{children}</div>
      </div>
    </div>
  );
}

function ResidentPage() {
  const { id } = useParams();
  const [resident, setResident] = useState<ResidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (!id) return;
    fetch(`${BASE_URL}/Resident/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Resident not found");
        return res.json();
      })
      .then(setResident)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
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

  return (
    <div className="beacon-page container py-4">
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
              <p className="landing-section__eyebrow mb-2">Risk Level</p>
              <p className="mb-0 fs-5 fw-semibold">{dashIfEmpty(resident.currentRiskLevel)}</p>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="accordion resident-records-accordion" id="resident-records">
            <RecordAccordion
              sectionId="resident-education"
              title="Education records"
              count={educationRecords.length}
              isOpen={!!openSections.education}
              onToggle={() => toggleSection("education")}
            >
              <div className="table-responsive">
                {educationRecords.length === 0 ? (
                  <p className="text-muted small mb-0 p-3">No education records.</p>
                ) : (
                  <table className="table table-sm table-striped table-hover mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Level</th>
                        <th>School</th>
                        <th>Enrollment</th>
                        <th>Attendance %</th>
                        <th>Progress %</th>
                        <th>Completion</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {educationRecords.map((e) => (
                        <tr key={e.educationRecordId}>
                          <td>{formatDate(e.recordDate)}</td>
                          <td>{dashIfEmpty(e.educationLevel)}</td>
                          <td>{dashIfEmpty(e.schoolName)}</td>
                          <td>{dashIfEmpty(e.enrollmentStatus)}</td>
                          <td>{fmtNum(e.attendanceRate)}</td>
                          <td>{fmtNum(e.progressPercent)}</td>
                          <td>{dashIfEmpty(e.completionStatus)}</td>
                          <td title={e.notes ?? ""}>{clip(e.notes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </RecordAccordion>

            <RecordAccordion
              sectionId="resident-health"
              title="Health and wellness records"
              count={healthWellbeingRecords.length}
              isOpen={!!openSections.health}
              onToggle={() => toggleSection("health")}
            >
              <div className="table-responsive">
                {healthWellbeingRecords.length === 0 ? (
                  <p className="text-muted small mb-0 p-3">No health and wellness records.</p>
                ) : (
                  <table className="table table-sm table-striped table-hover mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>General</th>
                        <th>Nutrition</th>
                        <th>Sleep</th>
                        <th>Energy</th>
                        <th>Ht (cm)</th>
                        <th>Wt (kg)</th>
                        <th>BMI</th>
                        <th>Med</th>
                        <th>Dental</th>
                        <th>Psych</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {healthWellbeingRecords.map((h) => (
                        <tr key={h.healthRecordId}>
                          <td>{formatDate(h.recordDate)}</td>
                          <td>{fmtNum(h.generalHealthScore)}</td>
                          <td>{fmtNum(h.nutritionScore)}</td>
                          <td>{fmtNum(h.sleepQualityScore)}</td>
                          <td>{fmtNum(h.energyLevelScore)}</td>
                          <td>{fmtNum(h.heightCm)}</td>
                          <td>{fmtNum(h.weightKg)}</td>
                          <td>{fmtNum(h.bmi)}</td>
                          <td>{fmtBool(h.medicalCheckupDone)}</td>
                          <td>{fmtBool(h.dentalCheckupDone)}</td>
                          <td>{fmtBool(h.psychologicalCheckupDone)}</td>
                          <td title={h.notes ?? ""}>{clip(h.notes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </RecordAccordion>

            <RecordAccordion
              sectionId="resident-process"
              title="Mental health records (process recordings)"
              count={processRecordings.length}
              isOpen={!!openSections.process}
              onToggle={() => toggleSection("process")}
            >
              <div className="table-responsive">
                {processRecordings.length === 0 ? (
                  <p className="text-muted small mb-0 p-3">No process recordings.</p>
                ) : (
                  <table className="table table-sm table-striped table-hover mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Session date</th>
                        <th>Social worker</th>
                        <th>Type</th>
                        <th>Minutes</th>
                        <th>Emotion (start)</th>
                        <th>Emotion (end)</th>
                        <th>Progress</th>
                        <th>Concerns</th>
                        <th>Referral</th>
                        <th>Interventions</th>
                        <th>Follow-up</th>
                        <th>Narrative</th>
                        <th>Restricted notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processRecordings.map((p) => (
                        <tr key={p.recordingId}>
                          <td>{formatDate(p.sessionDate)}</td>
                          <td>{dashIfEmpty(p.socialWorker)}</td>
                          <td>{dashIfEmpty(p.sessionType)}</td>
                          <td>{p.sessionDurationMinutes ?? "\u2014"}</td>
                          <td>{clip(p.emotionalStateObserved, 40)}</td>
                          <td>{clip(p.emotionalStateEnd, 40)}</td>
                          <td>{fmtBool(p.progressNoted)}</td>
                          <td>{fmtBool(p.concernsFlagged)}</td>
                          <td>{fmtBool(p.referralMade)}</td>
                          <td title={p.interventionsApplied ?? ""}>{clip(p.interventionsApplied)}</td>
                          <td title={p.followUpActions ?? ""}>{clip(p.followUpActions)}</td>
                          <td title={p.sessionNarrative ?? ""}>{clip(p.sessionNarrative)}</td>
                          <td title={p.notesRestricted ?? ""}>{clip(p.notesRestricted)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </RecordAccordion>

            <RecordAccordion
              sectionId="resident-home"
              title="Home visits"
              count={homeVisitations.length}
              isOpen={!!openSections.home}
              onToggle={() => toggleSection("home")}
            >
              <div className="table-responsive">
                {homeVisitations.length === 0 ? (
                  <p className="text-muted small mb-0 p-3">No home visits.</p>
                ) : (
                  <table className="table table-sm table-striped table-hover mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Visit date</th>
                        <th>Social worker</th>
                        <th>Type</th>
                        <th>Location</th>
                        <th>Purpose</th>
                        <th>Observations</th>
                        <th>Family cooperation</th>
                        <th>Safety concern</th>
                        <th>Follow-up</th>
                        <th>Outcome</th>
                        <th>Follow-up notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {homeVisitations.map((v) => (
                        <tr key={v.visitationId}>
                          <td>{formatDate(v.visitDate)}</td>
                          <td>{dashIfEmpty(v.socialWorker)}</td>
                          <td>{dashIfEmpty(v.visitType)}</td>
                          <td>{clip(v.locationVisited, 60)}</td>
                          <td title={v.purpose ?? ""}>{clip(v.purpose)}</td>
                          <td title={v.observations ?? ""}>{clip(v.observations)}</td>
                          <td>{dashIfEmpty(v.familyCooperationLevel)}</td>
                          <td>{fmtBool(v.safetyConcernsNoted)}</td>
                          <td>{fmtBool(v.followUpNeeded)}</td>
                          <td>{clip(v.visitOutcome)}</td>
                          <td title={v.followUpNotes ?? ""}>{clip(v.followUpNotes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </RecordAccordion>

            <RecordAccordion
              sectionId="resident-incidents"
              title="Incident reports"
              count={incidentReports.length}
              isOpen={!!openSections.incidents}
              onToggle={() => toggleSection("incidents")}
            >
              <div className="table-responsive">
                {incidentReports.length === 0 ? (
                  <p className="text-muted small mb-0 p-3">No incident reports.</p>
                ) : (
                  <table className="table table-sm table-striped table-hover mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Safehouse</th>
                        <th>Type</th>
                        <th>Severity</th>
                        <th>Description</th>
                        <th>Response</th>
                        <th>Resolved</th>
                        <th>Resolution date</th>
                        <th>Reported by</th>
                        <th>Follow-up req.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidentReports.map((i) => (
                        <tr key={i.incidentId}>
                          <td>{formatDate(i.incidentDate)}</td>
                          <td>{dashIfEmpty(i.safehouseName)}</td>
                          <td>{dashIfEmpty(i.incidentType)}</td>
                          <td>{dashIfEmpty(i.severity)}</td>
                          <td title={i.description ?? ""}>{clip(i.description)}</td>
                          <td title={i.responseTaken ?? ""}>{clip(i.responseTaken)}</td>
                          <td>{fmtBool(i.resolved)}</td>
                          <td>{formatDate(i.resolutionDate)}</td>
                          <td>{dashIfEmpty(i.reportedBy)}</td>
                          <td>{fmtBool(i.followUpRequired)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </RecordAccordion>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResidentPage;
