import { useEffect, useState } from "react";
import type { ProcessRecordingRow } from "../../types/residentRecords";
import { BASE_URL } from "../../config/api";
import { ResidentRecordModal } from "./ResidentRecordModal";
import {
  dateForDateInput,
  mergePicklistOption,
  messageFromJsonPayload,
  optionalInt,
  parseServerErrors,
  picklistStrings,
  postBeaconJson,
  readResponseJson,
  requiredFieldMsg,
  validateResidentIdInput,
} from "./residentRecordFormUtils";

const FIELD_KEYS = [
  "resident_id",
  "session_date",
  "session_duration_minutes",
] as const;

type FieldKey = (typeof FIELD_KEYS)[number];

type Props = {
  open: boolean;
  onClose: () => void;
  initialResidentId?: number;
  existingRecord?: ProcessRecordingRow | null;
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

export function AddProcessRecordingModal({
  open,
  onClose,
  initialResidentId,
  existingRecord = null,
  onCreated,
}: Props) {
  const isEdit = existingRecord != null;
  const [residentIdInput, setResidentIdInput] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [socialWorker, setSocialWorker] = useState("");
  const [sessionType, setSessionType] = useState("");
  const [sessionTypes, setSessionTypes] = useState<string[]>([]);
  const [emotionalObservedOptions, setEmotionalObservedOptions] = useState<string[]>([]);
  const [emotionalEndOptions, setEmotionalEndOptions] = useState<string[]>([]);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState("");
  const [emotionalStateObserved, setEmotionalStateObserved] = useState("");
  const [emotionalStateEnd, setEmotionalStateEnd] = useState("");
  const [interventionsApplied, setInterventionsApplied] = useState("");
  const [followUpActions, setFollowUpActions] = useState("");
  const [progressNoted, setProgressNoted] = useState(false);
  const [concernsFlagged, setConcernsFlagged] = useState(false);
  const [referralMade, setReferralMade] = useState(false);
  const [sessionNarrative, setSessionNarrative] = useState("");
  const [notesRestricted, setNotesRestricted] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    if (existingRecord) {
      setSessionDate(dateForDateInput(existingRecord.sessionDate));
      setSocialWorker(existingRecord.socialWorker ?? "");
      setSessionType(existingRecord.sessionType ?? "");
      setSessionDurationMinutes(
        existingRecord.sessionDurationMinutes != null
          ? String(existingRecord.sessionDurationMinutes)
          : "",
      );
      setEmotionalStateObserved(existingRecord.emotionalStateObserved ?? "");
      setEmotionalStateEnd(existingRecord.emotionalStateEnd ?? "");
      setInterventionsApplied(existingRecord.interventionsApplied ?? "");
      setFollowUpActions(existingRecord.followUpActions ?? "");
      setProgressNoted(existingRecord.progressNoted === true);
      setConcernsFlagged(existingRecord.concernsFlagged === true);
      setReferralMade(existingRecord.referralMade === true);
      setSessionNarrative(existingRecord.sessionNarrative ?? "");
      setNotesRestricted(existingRecord.notesRestricted ?? "");
    } else {
      setSessionDate("");
      setSocialWorker("");
      setSessionType("");
      setSessionDurationMinutes("");
      setEmotionalStateObserved("");
      setEmotionalStateEnd("");
      setInterventionsApplied("");
      setFollowUpActions("");
      setProgressNoted(false);
      setConcernsFlagged(false);
      setReferralMade(false);
      setSessionNarrative("");
      setNotesRestricted("");
    }

    fetch(`${BASE_URL}/ProcessRecordingPicklists`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: unknown) => {
        let st = picklistStrings(data, "session_types");
        let eo = picklistStrings(data, "emotional_states_observed");
        let ee = picklistStrings(data, "emotional_states_end");
        if (existingRecord) {
          st = mergePicklistOption(st, existingRecord.sessionType);
          eo = mergePicklistOption(eo, existingRecord.emotionalStateObserved);
          ee = mergePicklistOption(ee, existingRecord.emotionalStateEnd);
        }
        setSessionTypes(st);
        setEmotionalObservedOptions(eo);
        setEmotionalEndOptions(ee);
      })
      .catch(() => {
        setSessionTypes(existingRecord ? mergePicklistOption([], existingRecord.sessionType) : []);
        setEmotionalObservedOptions(
          existingRecord ? mergePicklistOption([], existingRecord.emotionalStateObserved) : [],
        );
        setEmotionalEndOptions(
          existingRecord ? mergePicklistOption([], existingRecord.emotionalStateEnd) : [],
        );
      });
  }, [open, initialResidentId, existingRecord]);

  function validate(): Partial<Record<FieldKey, string>> {
    const e: Partial<Record<FieldKey, string>> = {};
    const ridErr = validateResidentIdInput(residentIdInput);
    if (ridErr) e.resident_id = ridErr;
    if (!sessionDate.trim()) e.session_date = requiredFieldMsg;
    const durRaw = sessionDurationMinutes.trim();
    if (durRaw) {
      const n = optionalInt(durRaw);
      if (n === null) e.session_duration_minutes = "Enter a valid whole number.";
      else if (n < 0) e.session_duration_minutes = "Must be zero or greater.";
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
    const dur = optionalInt(sessionDurationMinutes);

    setSubmitting(true);
    try {
      const body = {
        resident_id: residentId,
        session_date: sessionDate,
        social_worker: socialWorker.trim() || null,
        session_type: sessionType.trim() || null,
        session_duration_minutes: dur,
        emotional_state_observed: emotionalStateObserved.trim() || null,
        emotional_state_end: emotionalStateEnd.trim() || null,
        interventions_applied: interventionsApplied.trim() || null,
        follow_up_actions: followUpActions.trim() || null,
        progress_noted: progressNoted,
        concerns_flagged: concernsFlagged,
        referral_made: referralMade,
        session_narrative: sessionNarrative.trim() || null,
        notes_restricted: notesRestricted.trim() || null,
      };
      const res = isEdit
        ? await postBeaconJson(`/ProcessRecording/${existingRecord!.recordingId}/Update`, body)
        : await fetch(`${BASE_URL}/ProcessRecording`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(body),
          });

      if (res.status === 201 || res.status === 200) {
        onCreated();
        onClose();
        return;
      }

      const { payload } = await readResponseJson(res);

      if (res.status === 400 && payload) {
        setFieldErrors((prev) => ({ ...prev, ...parseServerErrors(FIELD_KEYS, payload) }));
        const msg =
          typeof (payload as { message?: string }).message === "string"
            ? (payload as { message: string }).message
            : "Please correct the highlighted fields.";
        setFormError(msg);
        return;
      }

      setFormError(
        res.status === 401
          ? "You must be signed in."
          : res.status === 403
            ? "You do not have permission to save."
            : messageFromJsonPayload(payload, "Could not save."),
      );
    } catch {
      setFormError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !existingRecord) return;
    if (
      !window.confirm(
        "Delete this record from the database? This cannot be undone. Click Cancel to keep the record.",
      )
    )
      return;

    const residentId = Math.trunc(Number(residentIdInput.trim()));
    if (!Number.isInteger(residentId) || residentId <= 0) {
      setFormError("Resident ID is invalid.");
      return;
    }

    setDeleting(true);
    setFormError(null);
    try {
      const res = await postBeaconJson(`/ProcessRecording/${existingRecord.recordingId}/Delete`, {
        resident_id: residentId,
      });
      if (res.status === 204 || res.status === 200) {
        onCreated();
        onClose();
        return;
      }

      const { payload } = await readResponseJson(res);

      if (res.status === 400 && payload) {
        setFieldErrors((prev) => ({ ...prev, ...parseServerErrors(FIELD_KEYS, payload) }));
        const msg =
          typeof (payload as { message?: string }).message === "string"
            ? (payload as { message: string }).message
            : "Could not delete this record.";
        setFormError(msg);
        return;
      }

      setFormError(
        res.status === 401
          ? "You must be signed in."
          : res.status === 403
            ? "You do not have permission to delete."
            : messageFromJsonPayload(payload, "Could not delete this record."),
      );
    } catch {
      setFormError("Network error. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ResidentRecordModal
      title={isEdit ? "Update Mental Wellbeing Record" : "Add Mental Wellbeing Record"}
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
          <label className="form-label small fw-semibold" htmlFor="p-resident-id">
            Resident ID
            {labelSuffix(fieldErrors, "resident_id")}
          </label>
          <input
            id="p-resident-id"
            type="text"
            inputMode="numeric"
            placeholder="Example: 101"
            className={`form-control form-control-sm${fieldErrors.resident_id ? " is-invalid" : ""}`}
            value={residentIdInput}
            onChange={(e) => setResidentIdInput(e.target.value)}
            readOnly={isEdit}
          />
          {fieldErrors.resident_id ? (
            <div className="invalid-feedback d-block">{fieldErrors.resident_id}</div>
          ) : null}
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="p-session-date">
            Session Date
            {labelSuffix(fieldErrors, "session_date")}
          </label>
          <input
            id="p-session-date"
            type="date"
            className={`form-control form-control-sm${fieldErrors.session_date ? " is-invalid" : ""}`}
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
          />
          {fieldErrors.session_date ? (
            <div className="invalid-feedback d-block">{fieldErrors.session_date}</div>
          ) : null}
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="p-sw">
            Social Worker
          </label>
          <input
            id="p-sw"
            type="text"
            className="form-control form-control-sm"
            placeholder="Example: J. Smith"
            value={socialWorker}
            onChange={(e) => setSocialWorker(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="p-type">
            Session Type
          </label>
          <select
            id="p-type"
            className="form-select form-select-sm"
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value)}
          >
            <option value="">Select Session Type…</option>
            {sessionTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="p-dur">
            Session Duration (Minutes)
            {labelSuffix(fieldErrors, "session_duration_minutes")}
          </label>
          <input
            id="p-dur"
            type="text"
            inputMode="numeric"
            placeholder="Example: 45"
            className={`form-control form-control-sm${fieldErrors.session_duration_minutes ? " is-invalid" : ""}`}
            value={sessionDurationMinutes}
            onChange={(e) => setSessionDurationMinutes(e.target.value)}
          />
          {fieldErrors.session_duration_minutes ? (
            <div className="invalid-feedback d-block">{fieldErrors.session_duration_minutes}</div>
          ) : null}
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="p-emo1">
            Emotional State Observed
          </label>
          <select
            id="p-emo1"
            className="form-select form-select-sm"
            value={emotionalStateObserved}
            onChange={(e) => setEmotionalStateObserved(e.target.value)}
          >
            <option value="">Select Emotional State…</option>
            {emotionalObservedOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="p-emo2">
            Emotional State End
          </label>
          <select
            id="p-emo2"
            className="form-select form-select-sm"
            value={emotionalStateEnd}
            onChange={(e) => setEmotionalStateEnd(e.target.value)}
          >
            <option value="">Select Emotional State…</option>
            {emotionalEndOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="p-int">
            Interventions Applied
          </label>
          <textarea
            id="p-int"
            className="form-control form-control-sm"
            rows={2}
            value={interventionsApplied}
            onChange={(e) => setInterventionsApplied(e.target.value)}
            placeholder="Example: CBT techniques, safety planning…"
          />
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="p-fu">
            Follow Up Actions
          </label>
          <textarea
            id="p-fu"
            className="form-control form-control-sm"
            rows={2}
            value={followUpActions}
            onChange={(e) => setFollowUpActions(e.target.value)}
            placeholder="Example: Schedule follow-up next week…"
          />
        </div>

        <div className="form-check mb-2">
          <input
            id="p-prog"
            type="checkbox"
            className="form-check-input"
            checked={progressNoted}
            onChange={(e) => setProgressNoted(e.target.checked)}
          />
          <label className="form-check-label small fw-semibold" htmlFor="p-prog">
            Progress Noted
          </label>
        </div>
        <div className="form-check mb-2">
          <input
            id="p-conc"
            type="checkbox"
            className="form-check-input"
            checked={concernsFlagged}
            onChange={(e) => setConcernsFlagged(e.target.checked)}
          />
          <label className="form-check-label small fw-semibold" htmlFor="p-conc">
            Concerns Flagged
          </label>
        </div>
        <div className="form-check mb-3">
          <input
            id="p-ref"
            type="checkbox"
            className="form-check-input"
            checked={referralMade}
            onChange={(e) => setReferralMade(e.target.checked)}
          />
          <label className="form-check-label small fw-semibold" htmlFor="p-ref">
            Referral Made
          </label>
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="p-nar">
            Session Narrative
          </label>
          <textarea
            id="p-nar"
            className="form-control form-control-sm"
            rows={3}
            value={sessionNarrative}
            onChange={(e) => setSessionNarrative(e.target.value)}
            placeholder="Example: Session summary and resident engagement…"
          />
        </div>

        <div className="mb-4">
          <label className="form-label small fw-semibold" htmlFor="p-notes">
            Private Notes
          </label>
          <textarea
            id="p-notes"
            className="form-control form-control-sm"
            rows={2}
            value={notesRestricted}
            onChange={(e) => setNotesRestricted(e.target.value)}
            placeholder="Example: Restricted note (optional)"
          />
        </div>

        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div>
            {isEdit ? (
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => void handleDelete()}
                disabled={submitting || deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            ) : null}
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onClose}
              disabled={submitting || deleting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-sm btn-primary" disabled={submitting || deleting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Save Record"}
            </button>
          </div>
        </div>
      </form>
    </ResidentRecordModal>
  );
}
