import { useEffect, useState } from "react";
import { BASE_URL } from "../../config/api";
import { ResidentRecordModal } from "./ResidentRecordModal";

type FieldKey =
  | "resident_id"
  | "record_date"
  | "school_name"
  | "enrollment_status"
  | "attendance_rate"
  | "progress_percent"
  | "completion_status";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Prefills Resident ID when opened from a resident page; leave unset for admin flows where staff enter it manually. */
  initialResidentId?: number;
  onCreated: () => void;
};

const requiredMsg = "This field is required.";

const FIELD_KEYS: FieldKey[] = [
  "resident_id",
  "record_date",
  "school_name",
  "enrollment_status",
  "attendance_rate",
  "progress_percent",
  "completion_status",
];

function isFieldKey(k: string): k is FieldKey {
  return (FIELD_KEYS as readonly string[]).includes(k);
}

/** Maps API error keys (snake_case or legacy PascalCase / camelCase) to form fields. */
function parseServerErrors(payload: unknown): Partial<Record<FieldKey, string>> {
  if (!payload || typeof payload !== "object") return {};
  const errors = (payload as { errors?: Record<string, string> }).errors;
  if (!errors || typeof errors !== "object") return {};
  const out: Partial<Record<FieldKey, string>> = {};
  for (const [rawKey, v] of Object.entries(errors)) {
    if (typeof v !== "string") continue;
    let key = rawKey;
    if (!key.includes("_") && key.length > 0) {
      key = key[0].toLowerCase() + key.slice(1);
      key = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      if (key.startsWith("_")) key = key.slice(1);
    }
    key = key.toLowerCase();
    if (isFieldKey(key)) out[key] = v;
  }
  return out;
}

export function AddEducationRecordModal({
  open,
  onClose,
  initialResidentId,
  onCreated,
}: Props) {
  const [schoolNames, setSchoolNames] = useState<string[]>([]);
  const [residentIdInput, setResidentIdInput] = useState("");
  const [recordDate, setRecordDate] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [enrollmentStatus, setEnrollmentStatus] = useState<
    "" | "Enrolled" | "Not Enrolled"
  >("");
  const [attendanceRate, setAttendanceRate] = useState("");
  const [progressPercent, setProgressPercent] = useState("");
  const [completionStatus, setCompletionStatus] = useState<
    "" | "NotStarted" | "InProgress"
  >("");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFieldErrors({});
    setFormError(null);
    setResidentIdInput(
      initialResidentId !== undefined &&
        initialResidentId !== null &&
        Number.isFinite(initialResidentId)
        ? String(Math.trunc(initialResidentId))
        : "",
    );
    setRecordDate("");
    setSchoolName("");
    setEnrollmentStatus("");
    setAttendanceRate("");
    setProgressPercent("");
    setCompletionStatus("");
    setNotes("");
    fetch(`${BASE_URL}/EducationRecordSchoolNames`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) =>
        setSchoolNames(Array.isArray(data) ? (data as string[]).filter(Boolean) : []),
      )
      .catch(() => setSchoolNames([]));
  }, [open, initialResidentId]);

  function labelSuffix(key: FieldKey) {
    return fieldErrors[key] ? (
      <span className="text-danger" aria-hidden>
        {" "}
        *
      </span>
    ) : null;
  }

  function validate(): Partial<Record<FieldKey, string>> {
    const e: Partial<Record<FieldKey, string>> = {};
    const rid = residentIdInput.trim();
    if (!rid) e.resident_id = requiredMsg;
    else {
      const n = Number(rid);
      if (!Number.isInteger(n) || n <= 0)
        e.resident_id = "Enter a valid positive whole number.";
    }

    if (!recordDate.trim()) e.record_date = requiredMsg;
    if (!schoolName.trim()) e.school_name = requiredMsg;
    if (!enrollmentStatus) e.enrollment_status = requiredMsg;
    if (!completionStatus) e.completion_status = requiredMsg;

    const attRaw = attendanceRate.trim();
    if (!attRaw) e.attendance_rate = requiredMsg;
    else {
      const att = Number(attRaw);
      if (Number.isNaN(att)) e.attendance_rate = "Enter a valid number.";
      else if (att < 0 || att > 1) e.attendance_rate = "Must be between 0 and 1.";
    }

    const progRaw = progressPercent.trim();
    if (!progRaw) e.progress_percent = requiredMsg;
    else {
      const prog = Number(progRaw);
      if (Number.isNaN(prog)) e.progress_percent = "Enter a valid number.";
      else if (prog < 0 || prog > 100)
        e.progress_percent = "Must be between 0 and 100.";
    }

    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError(null);
    const local = validate();
    setFieldErrors(local);
    if (Object.keys(local).length > 0) {
      setFormError("Please complete all required fields.");
      return;
    }

    const residentId = Math.trunc(Number(residentIdInput.trim()));
    const att = Math.round(Number(attendanceRate.trim()) * 1000) / 1000;
    const prog = Math.round(Number(progressPercent.trim()) * 10) / 10;

    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/EducationRecord`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resident_id: residentId,
          record_date: recordDate,
          school_name: schoolName.trim(),
          enrollment_status: enrollmentStatus,
          attendance_rate: att,
          progress_percent: prog,
          completion_status: completionStatus,
          notes: notes.trim() || null,
        }),
      });

      if (res.status === 201) {
        onCreated();
        onClose();
        return;
      }

      let payload: unknown;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (res.status === 400 && payload) {
        const serverErr = parseServerErrors(payload);
        setFieldErrors((prev) => ({ ...prev, ...serverErr }));
        const msg =
          typeof (payload as { message?: string }).message === "string"
            ? (payload as { message: string }).message
            : "Please correct the highlighted fields.";
        setFormError(msg);
        return;
      }

      setFormError(res.status === 401 ? "You must be signed in." : "Could not save.");
    } catch {
      setFormError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResidentRecordModal
      title="Add Education Record"
      open={open}
      onClose={onClose}
      narrow
    >
      <form className="p-4" onSubmit={handleSubmit} noValidate>
        {formError ? (
          <div className="alert alert-warning small" role="alert">
            {formError}
          </div>
        ) : null}

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="edu-resident-id">
            Resident ID
            {labelSuffix("resident_id")}
          </label>
          <input
            id="edu-resident-id"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Resident ID"
            className={`form-control form-control-sm${fieldErrors.resident_id ? " is-invalid" : ""}`}
            value={residentIdInput}
            onChange={(e) => setResidentIdInput(e.target.value)}
          />
          {fieldErrors.resident_id ? (
            <div className="invalid-feedback d-block">{fieldErrors.resident_id}</div>
          ) : null}
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="edu-record-date">
            Record Date
            {labelSuffix("record_date")}
          </label>
          <input
            id="edu-record-date"
            type="date"
            className={`form-control form-control-sm${fieldErrors.record_date ? " is-invalid" : ""}`}
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
          />
          {fieldErrors.record_date ? (
            <div className="invalid-feedback d-block">{fieldErrors.record_date}</div>
          ) : null}
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="edu-school">
            School Name
            {labelSuffix("school_name")}
          </label>
          <select
            id="edu-school"
            className={`form-select form-select-sm${fieldErrors.school_name ? " is-invalid" : ""}`}
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
          >
            <option value="">Select A School…</option>
            {schoolNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {fieldErrors.school_name ? (
            <div className="invalid-feedback d-block">{fieldErrors.school_name}</div>
          ) : null}
        </div>

        <fieldset className="mb-3">
          <legend className="form-label small fw-semibold mb-2">
            Enrollment Status
            {labelSuffix("enrollment_status")}
          </legend>
          <div className="d-flex flex-wrap gap-3">
            <div className="form-check">
              <input
                className={`form-check-input${fieldErrors.enrollment_status ? " is-invalid" : ""}`}
                type="radio"
                name="enrollment_status"
                id="edu-enrolled"
                checked={enrollmentStatus === "Enrolled"}
                onChange={() => setEnrollmentStatus("Enrolled")}
              />
              <label className="form-check-label" htmlFor="edu-enrolled">
                Enrolled
              </label>
            </div>
            <div className="form-check">
              <input
                className={`form-check-input${fieldErrors.enrollment_status ? " is-invalid" : ""}`}
                type="radio"
                name="enrollment_status"
                id="edu-not-enrolled"
                checked={enrollmentStatus === "Not Enrolled"}
                onChange={() => setEnrollmentStatus("Not Enrolled")}
              />
              <label className="form-check-label" htmlFor="edu-not-enrolled">
                Not Enrolled
              </label>
            </div>
          </div>
          {fieldErrors.enrollment_status ? (
            <div className="invalid-feedback d-block">{fieldErrors.enrollment_status}</div>
          ) : null}
        </fieldset>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="edu-attendance">
            Attendance Rate (0–1)
            {labelSuffix("attendance_rate")}
          </label>
          <input
            id="edu-attendance"
            type="text"
            inputMode="decimal"
            placeholder="Example: 0.925"
            className={`form-control form-control-sm${fieldErrors.attendance_rate ? " is-invalid" : ""}`}
            value={attendanceRate}
            onChange={(e) => setAttendanceRate(e.target.value)}
          />
          <p className="form-text small mb-0">Stored Rounded To Three Decimal Places.</p>
          {fieldErrors.attendance_rate ? (
            <div className="invalid-feedback d-block">{fieldErrors.attendance_rate}</div>
          ) : null}
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="edu-progress">
            Progress Percentage (0–100)
            {labelSuffix("progress_percent")}
          </label>
          <input
            id="edu-progress"
            type="text"
            inputMode="decimal"
            placeholder="Example: 67.5"
            className={`form-control form-control-sm${fieldErrors.progress_percent ? " is-invalid" : ""}`}
            value={progressPercent}
            onChange={(e) => setProgressPercent(e.target.value)}
          />
          <p className="form-text small mb-0">Stored Rounded To One Decimal Place.</p>
          {fieldErrors.progress_percent ? (
            <div className="invalid-feedback d-block">{fieldErrors.progress_percent}</div>
          ) : null}
        </div>

        <fieldset className="mb-3">
          <legend className="form-label small fw-semibold mb-2">
            Completion Status
            {labelSuffix("completion_status")}
          </legend>
          <div className="d-flex flex-wrap gap-3">
            <div className="form-check">
              <input
                className={`form-check-input${fieldErrors.completion_status ? " is-invalid" : ""}`}
                type="radio"
                name="completion_status"
                id="edu-not-started"
                checked={completionStatus === "NotStarted"}
                onChange={() => setCompletionStatus("NotStarted")}
              />
              <label className="form-check-label" htmlFor="edu-not-started">
                Not Started
              </label>
            </div>
            <div className="form-check">
              <input
                className={`form-check-input${fieldErrors.completion_status ? " is-invalid" : ""}`}
                type="radio"
                name="completion_status"
                id="edu-in-progress"
                checked={completionStatus === "InProgress"}
                onChange={() => setCompletionStatus("InProgress")}
              />
              <label className="form-check-label" htmlFor="edu-in-progress">
                In Progress
              </label>
            </div>
          </div>
          {fieldErrors.completion_status ? (
            <div className="invalid-feedback d-block">{fieldErrors.completion_status}</div>
          ) : null}
        </fieldset>

        <div className="mb-4">
          <label className="form-label small fw-semibold" htmlFor="edu-notes">
            Notes
          </label>
          <textarea
            id="edu-notes"
            className="form-control form-control-sm"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="d-flex gap-2 justify-content-end">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-sm btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : "Save Record"}
          </button>
        </div>
      </form>
    </ResidentRecordModal>
  );
}
