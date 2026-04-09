import { useEffect, useState } from "react";
import type { HomeVisitationRow } from "../../types/residentRecords";
import { BASE_URL } from "../../config/api";
import { ResidentRecordModal } from "./ResidentRecordModal";
import {
  dateForDateInput,
  mergePicklistOption,
  messageFromJsonPayload,
  parseServerErrors,
  picklistStrings,
  postBeaconJson,
  readResponseJson,
  requiredFieldMsg,
  validateResidentIdInput,
} from "./residentRecordFormUtils";

const FIELD_KEYS = ["resident_id", "visit_date"] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

type Props = {
  open: boolean;
  onClose: () => void;
  initialResidentId?: number;
  existingRecord?: HomeVisitationRow | null;
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

export function AddHomeVisitationModal({
  open,
  onClose,
  initialResidentId,
  existingRecord = null,
  onCreated,
}: Props) {
  const isEdit = existingRecord != null;
  const [residentIdInput, setResidentIdInput] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [socialWorker, setSocialWorker] = useState("");
  const [visitType, setVisitType] = useState("");
  const [visitTypes, setVisitTypes] = useState<string[]>([]);
  const [cooperationOptions, setCooperationOptions] = useState<string[]>([]);
  const [outcomeOptions, setOutcomeOptions] = useState<string[]>([]);
  const [locationVisited, setLocationVisited] = useState("");
  const [familyMembersPresent, setFamilyMembersPresent] = useState("");
  const [purpose, setPurpose] = useState("");
  const [observations, setObservations] = useState("");
  const [familyCooperationLevel, setFamilyCooperationLevel] = useState("");
  const [safetyConcernsNoted, setSafetyConcernsNoted] = useState(false);
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [visitOutcome, setVisitOutcome] = useState("");
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
      setVisitDate(dateForDateInput(existingRecord.visitDate));
      setSocialWorker(existingRecord.socialWorker ?? "");
      setVisitType(existingRecord.visitType ?? "");
      setLocationVisited(existingRecord.locationVisited ?? "");
      setFamilyMembersPresent(existingRecord.familyMembersPresent ?? "");
      setPurpose(existingRecord.purpose ?? "");
      setObservations(existingRecord.observations ?? "");
      setFamilyCooperationLevel(existingRecord.familyCooperationLevel ?? "");
      setSafetyConcernsNoted(existingRecord.safetyConcernsNoted === true);
      setFollowUpNeeded(existingRecord.followUpNeeded === true);
      setFollowUpNotes(existingRecord.followUpNotes ?? "");
      setVisitOutcome(existingRecord.visitOutcome ?? "");
    } else {
      setVisitDate("");
      setSocialWorker("");
      setVisitType("");
      setLocationVisited("");
      setFamilyMembersPresent("");
      setPurpose("");
      setObservations("");
      setFamilyCooperationLevel("");
      setSafetyConcernsNoted(false);
      setFollowUpNeeded(false);
      setFollowUpNotes("");
      setVisitOutcome("");
    }

    fetch(`${BASE_URL}/HomeVisitationPicklists`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: unknown) => {
        let vt = picklistStrings(data, "visit_types");
        let coop = picklistStrings(data, "family_cooperation_levels");
        let out = picklistStrings(data, "visit_outcomes");
        if (existingRecord) {
          vt = mergePicklistOption(vt, existingRecord.visitType);
          coop = mergePicklistOption(coop, existingRecord.familyCooperationLevel);
          out = mergePicklistOption(out, existingRecord.visitOutcome);
        }
        setVisitTypes(vt);
        setCooperationOptions(coop);
        setOutcomeOptions(out);
      })
      .catch(() => {
        setVisitTypes(existingRecord ? mergePicklistOption([], existingRecord.visitType) : []);
        setCooperationOptions(
          existingRecord ? mergePicklistOption([], existingRecord.familyCooperationLevel) : [],
        );
        setOutcomeOptions(existingRecord ? mergePicklistOption([], existingRecord.visitOutcome) : []);
      });
  }, [open, initialResidentId, existingRecord]);

  function validate(): Partial<Record<FieldKey, string>> {
    const e: Partial<Record<FieldKey, string>> = {};
    const ridErr = validateResidentIdInput(residentIdInput);
    if (ridErr) e.resident_id = ridErr;
    if (!visitDate.trim()) e.visit_date = requiredFieldMsg;
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
    setSubmitting(true);
    try {
      const body = {
        resident_id: residentId,
        visit_date: visitDate,
        social_worker: socialWorker.trim() || null,
        visit_type: visitType.trim() || null,
        location_visited: locationVisited.trim() || null,
        family_members_present: familyMembersPresent.trim() || null,
        purpose: purpose.trim() || null,
        observations: observations.trim() || null,
        family_cooperation_level: familyCooperationLevel.trim() || null,
        safety_concerns_noted: safetyConcernsNoted,
        follow_up_needed: followUpNeeded,
        follow_up_notes: followUpNotes.trim() || null,
        visit_outcome: visitOutcome.trim() || null,
      };
      const res = isEdit
        ? await postBeaconJson(`/HomeVisitation/${existingRecord!.visitationId}/Update`, body)
        : await fetch(`${BASE_URL}/HomeVisitation`, {
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
      const res = await postBeaconJson(`/HomeVisitation/${existingRecord.visitationId}/Delete`, {
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
      title={isEdit ? "Update Home Visit" : "Add Home Visit"}
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
          <label className="form-label small fw-semibold" htmlFor="v-resident-id">
            Resident ID
            {labelSuffix(fieldErrors, "resident_id")}
          </label>
          <input
            id="v-resident-id"
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
          <label className="form-label small fw-semibold" htmlFor="v-visit-date">
            Visit Date
            {labelSuffix(fieldErrors, "visit_date")}
          </label>
          <input
            id="v-visit-date"
            type="date"
            className={`form-control form-control-sm${fieldErrors.visit_date ? " is-invalid" : ""}`}
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
          />
          {fieldErrors.visit_date ? (
            <div className="invalid-feedback d-block">{fieldErrors.visit_date}</div>
          ) : null}
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="v-sw">
            Social Worker
          </label>
          <input
            id="v-sw"
            type="text"
            className="form-control form-control-sm"
            placeholder="Example: J. Smith"
            value={socialWorker}
            onChange={(e) => setSocialWorker(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="v-type">
            Visit Type
          </label>
          <select
            id="v-type"
            className="form-select form-select-sm"
            value={visitType}
            onChange={(e) => setVisitType(e.target.value)}
          >
            <option value="">Select Visit Type…</option>
            {visitTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="v-loc">
            Location Visited
          </label>
          <input
            id="v-loc"
            type="text"
            className="form-control form-control-sm"
            placeholder="Example: Family home, 123 Oak St."
            value={locationVisited}
            onChange={(e) => setLocationVisited(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="v-fam">
            Family Members Present
          </label>
          <input
            id="v-fam"
            type="text"
            className="form-control form-control-sm"
            placeholder="Example: Mother, two siblings"
            value={familyMembersPresent}
            onChange={(e) => setFamilyMembersPresent(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="v-purpose">
            Purpose
          </label>
          <input
            id="v-purpose"
            type="text"
            className="form-control form-control-sm"
            placeholder="Example: Wellness check-in"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="v-obs">
            Observations
          </label>
          <textarea
            id="v-obs"
            className="form-control form-control-sm"
            rows={3}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Example: Home environment, interactions observed…"
          />
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="v-coop">
            Family Cooperation Level
          </label>
          <select
            id="v-coop"
            className="form-select form-select-sm"
            value={familyCooperationLevel}
            onChange={(e) => setFamilyCooperationLevel(e.target.value)}
          >
            <option value="">Select Cooperation Level…</option>
            {cooperationOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="form-check mb-2">
          <input
            id="v-safe"
            type="checkbox"
            className="form-check-input"
            checked={safetyConcernsNoted}
            onChange={(e) => setSafetyConcernsNoted(e.target.checked)}
          />
          <label className="form-check-label small fw-semibold" htmlFor="v-safe">
            Safety Concerns Noted
          </label>
        </div>
        <div className="form-check mb-3">
          <input
            id="v-fun"
            type="checkbox"
            className="form-check-input"
            checked={followUpNeeded}
            onChange={(e) => setFollowUpNeeded(e.target.checked)}
          />
          <label className="form-check-label small fw-semibold" htmlFor="v-fun">
            Follow Up Needed
          </label>
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold" htmlFor="v-funotes">
            Follow Up Notes
          </label>
          <textarea
            id="v-funotes"
            className="form-control form-control-sm"
            rows={2}
            value={followUpNotes}
            onChange={(e) => setFollowUpNotes(e.target.value)}
            placeholder="Example: Follow-up plan (optional)"
          />
        </div>

        <div className="mb-4">
          <label className="form-label small fw-semibold" htmlFor="v-out">
            Visit Outcome
          </label>
          <select
            id="v-out"
            className="form-select form-select-sm"
            value={visitOutcome}
            onChange={(e) => setVisitOutcome(e.target.value)}
          >
            <option value="">Select Visit Outcome…</option>
            {outcomeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
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
