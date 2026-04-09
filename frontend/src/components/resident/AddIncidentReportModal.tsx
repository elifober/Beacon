import { useEffect, useState } from "react";
import { BASE_URL } from "../../config/api";
import { ResidentRecordModal } from "./ResidentRecordModal";
import {
  parseServerErrors,
  picklistStrings,
  requiredFieldMsg,
  validateResidentIdInput,
} from "./residentRecordFormUtils";

const FIELD_KEYS = ["resident_id", "safehouse_id", "incident_date"] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

type SafehouseOption = { safehouseId: number; city?: string; name?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  initialResidentId?: number;
  initialSafehouseId?: number;
  onCreated: () => void;
};

function labelSuffix(fieldErrors: Partial<Record<FieldKey, string>>, key: FieldKey) {
  return fieldErrors[key] ? (
    <span className="text-danger" aria-hidden>
      {" "}
      *
    </span>
  ) : null;
}

function validateSafehouseIdInput(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return requiredFieldMsg;
  const n = Number(t);
  if (!Number.isInteger(n) || n <= 0) return "Enter a valid positive whole number.";
  return undefined;
}

export function AddIncidentReportModal({
  open,
  onClose,
  initialResidentId,
  initialSafehouseId,
  onCreated,
}: Props) {
  const [residentIdInput, setResidentIdInput] = useState("");
  const [safehouseIdInput, setSafehouseIdInput] = useState("");
  const [safehouses, setSafehouses] = useState<SafehouseOption[]>([]);
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [incidentTypes, setIncidentTypes] = useState<string[]>([]);
  const [severity, setSeverity] = useState("");
  const [severities, setSeverities] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [responseTaken, setResponseTaken] = useState("");
  const [resolved, setResolved] = useState(false);
  const [resolutionDate, setResolutionDate] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
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
    setSafehouseIdInput(
      initialSafehouseId !== undefined &&
        initialSafehouseId !== null &&
        Number.isFinite(initialSafehouseId)
        ? String(Math.trunc(initialSafehouseId))
        : "",
    );
    setIncidentDate("");
    setIncidentType("");
    setSeverity("");
    setDescription("");
    setResponseTaken("");
    setResolved(false);
    setResolutionDate("");
    setReportedBy("");
    setFollowUpRequired(false);

    fetch(`${BASE_URL}/IncidentReportPicklists`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: unknown) => {
        setIncidentTypes(picklistStrings(data, "incident_types"));
        setSeverities(picklistStrings(data, "severities"));
      })
      .catch(() => {
        setIncidentTypes([]);
        setSeverities([]);
      });

    fetch(`${BASE_URL}/Safehouses`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (!Array.isArray(data)) {
          setSafehouses([]);
          return;
        }
        setSafehouses(
          data.map((x: unknown) => {
            const o = x as Record<string, unknown>;
            const id = Number(o.safehouseId ?? o.SafehouseId);
            return {
              safehouseId: id,
              city: typeof o.city === "string" ? o.city : undefined,
              name: typeof o.name === "string" ? o.name : undefined,
            };
          }).filter((s) => Number.isFinite(s.safehouseId)),
        );
      })
      .catch(() => setSafehouses([]));
  }, [open, initialResidentId, initialSafehouseId]);

  function validate(): Partial<Record<FieldKey, string>> {
    const e: Partial<Record<FieldKey, string>> = {};
    const ridErr = validateResidentIdInput(residentIdInput);
    if (ridErr) e.resident_id = ridErr;
    const sidErr = validateSafehouseIdInput(safehouseIdInput);
    if (sidErr) e.safehouse_id = sidErr;
    if (!incidentDate.trim()) e.incident_date = requiredFieldMsg;
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
    const safehouseId = Math.trunc(Number(safehouseIdInput.trim()));

    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/IncidentReport`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resident_id: residentId,
          safehouse_id: safehouseId,
          incident_date: incidentDate,
          incident_type: incidentType.trim() || null,
          severity: severity.trim() || null,
          description: description.trim() || null,
          response_taken: responseTaken.trim() || null,
          resolved: resolved,
          resolution_date: resolutionDate.trim() || null,
          reported_by: reportedBy.trim() || null,
          follow_up_required: followUpRequired,
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
        setFieldErrors((prev) => ({ ...prev, ...parseServerErrors(FIELD_KEYS, payload) }));
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
    <ResidentRecordModal title="Add Incident Report" open={open} onClose={onClose} narrow>
      <form className="p-4" onSubmit={handleSubmit} noValidate>
        {formError ? (
          <div className="alert alert-warning small" role="alert">
            {formError}
          </div>
        ) : null}

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="i-resident-id">
            Resident ID
            {labelSuffix(fieldErrors, "resident_id")}
          </label>
          <input
            id="i-resident-id"
            type="text"
            inputMode="numeric"
            className={`form-control form-control-sm${fieldErrors.resident_id ? " is-invalid" : ""}`}
            value={residentIdInput}
            onChange={(e) => setResidentIdInput(e.target.value)}
          />
          {fieldErrors.resident_id ? (
            <div className="invalid-feedback d-block">{fieldErrors.resident_id}</div>
          ) : null}
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="i-safehouse-id">
            Safehouse ID
            {labelSuffix(fieldErrors, "safehouse_id")}
          </label>
          <input
            id="i-safehouse-id"
            type="text"
            inputMode="numeric"
            className={`form-control form-control-sm${fieldErrors.safehouse_id ? " is-invalid" : ""}`}
            value={safehouseIdInput}
            onChange={(e) => setSafehouseIdInput(e.target.value)}
            list="i-safehouse-options"
          />
          <datalist id="i-safehouse-options">
            {safehouses.map((s) => (
              <option
                key={s.safehouseId}
                value={String(s.safehouseId)}
                label={[s.city, s.name].filter(Boolean).join(" — ") || undefined}
              />
            ))}
          </datalist>
          <p className="form-text small mb-0">
            Use The List As A Reference Or Type An ID Manually.
          </p>
          {fieldErrors.safehouse_id ? (
            <div className="invalid-feedback d-block">{fieldErrors.safehouse_id}</div>
          ) : null}
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="i-incident-date">
            Incident Date
            {labelSuffix(fieldErrors, "incident_date")}
          </label>
          <input
            id="i-incident-date"
            type="date"
            className={`form-control form-control-sm${fieldErrors.incident_date ? " is-invalid" : ""}`}
            value={incidentDate}
            onChange={(e) => setIncidentDate(e.target.value)}
          />
          {fieldErrors.incident_date ? (
            <div className="invalid-feedback d-block">{fieldErrors.incident_date}</div>
          ) : null}
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="i-type">
            Incident Type
          </label>
          <select
            id="i-type"
            className="form-select form-select-sm"
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
          >
            <option value="">Select Incident Type…</option>
            {incidentTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="i-sev">
            Severity
          </label>
          <select
            id="i-sev"
            className="form-select form-select-sm"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="">Select Severity…</option>
            {severities.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="i-desc">
            Description
          </label>
          <textarea
            id="i-desc"
            className="form-control form-control-sm"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="i-resp">
            Response Taken
          </label>
          <textarea
            id="i-resp"
            className="form-control form-control-sm"
            rows={2}
            value={responseTaken}
            onChange={(e) => setResponseTaken(e.target.value)}
          />
        </div>

        <div className="form-check mb-3">
          <input
            id="i-resolved"
            type="checkbox"
            className="form-check-input"
            checked={resolved}
            onChange={(e) => setResolved(e.target.checked)}
          />
          <label className="form-check-label small fw-semibold" htmlFor="i-resolved">
            Resolved
          </label>
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="i-resdate">
            Resolution Date
          </label>
          <input
            id="i-resdate"
            type="date"
            className="form-control form-control-sm"
            value={resolutionDate}
            onChange={(e) => setResolutionDate(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="i-by">
            Reported By
          </label>
          <input
            id="i-by"
            type="text"
            className="form-control form-control-sm"
            value={reportedBy}
            onChange={(e) => setReportedBy(e.target.value)}
          />
        </div>

        <div className="form-check mb-4">
          <input
            id="i-fu"
            type="checkbox"
            className="form-check-input"
            checked={followUpRequired}
            onChange={(e) => setFollowUpRequired(e.target.checked)}
          />
          <label className="form-check-label small fw-semibold" htmlFor="i-fu">
            Follow Up Required
          </label>
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
