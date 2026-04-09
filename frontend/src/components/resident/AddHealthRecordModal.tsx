import { useEffect, useState } from "react";
import type { HealthWellbeingRow } from "../../types/residentRecords";
import { BASE_URL } from "../../config/api";
import { ResidentRecordModal } from "./ResidentRecordModal";
import {
  dateForDateInput,
  decimalFieldString,
  messageFromJsonPayload,
  optionalDecimal,
  parseServerErrors,
  postBeaconJson,
  readResponseJson,
  requiredFieldMsg,
  validateResidentIdInput,
} from "./residentRecordFormUtils";

const FIELD_KEYS = [
  "resident_id",
  "record_date",
  "general_health_score",
  "nutrition_score",
  "sleep_quality_score",
  "energy_level_score",
  "height_cm",
  "weight_kg",
  "bmi",
] as const;

type FieldKey = (typeof FIELD_KEYS)[number];

type Props = {
  open: boolean;
  onClose: () => void;
  initialResidentId?: number;
  existingRecord?: HealthWellbeingRow | null;
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

export function AddHealthRecordModal({
  open,
  onClose,
  initialResidentId,
  existingRecord = null,
  onCreated,
}: Props) {
  const isEdit = existingRecord != null;
  const [residentIdInput, setResidentIdInput] = useState("");
  const [recordDate, setRecordDate] = useState("");
  const [generalHealthScore, setGeneralHealthScore] = useState("");
  const [nutritionScore, setNutritionScore] = useState("");
  const [sleepQualityScore, setSleepQualityScore] = useState("");
  const [energyLevelScore, setEnergyLevelScore] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [bmi, setBmi] = useState("");
  const [medicalDone, setMedicalDone] = useState(false);
  const [dentalDone, setDentalDone] = useState(false);
  const [psychDone, setPsychDone] = useState(false);
  const [notes, setNotes] = useState("");
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
      setRecordDate(dateForDateInput(existingRecord.recordDate));
      setGeneralHealthScore(decimalFieldString(existingRecord.generalHealthScore));
      setNutritionScore(decimalFieldString(existingRecord.nutritionScore));
      setSleepQualityScore(decimalFieldString(existingRecord.sleepQualityScore));
      setEnergyLevelScore(decimalFieldString(existingRecord.energyLevelScore));
      setHeightCm(decimalFieldString(existingRecord.heightCm));
      setWeightKg(decimalFieldString(existingRecord.weightKg));
      setBmi(decimalFieldString(existingRecord.bmi));
      setMedicalDone(existingRecord.medicalCheckupDone === true);
      setDentalDone(existingRecord.dentalCheckupDone === true);
      setPsychDone(existingRecord.psychologicalCheckupDone === true);
      setNotes(existingRecord.notes ?? "");
    } else {
      setRecordDate("");
      setGeneralHealthScore("");
      setNutritionScore("");
      setSleepQualityScore("");
      setEnergyLevelScore("");
      setHeightCm("");
      setWeightKg("");
      setBmi("");
      setMedicalDone(false);
      setDentalDone(false);
      setPsychDone(false);
      setNotes("");
    }
  }, [open, initialResidentId, existingRecord]);

  function validateOptionalScore0To5(
    raw: string,
    key: FieldKey,
    e: Partial<Record<FieldKey, string>>,
  ) {
    const t = raw.trim();
    if (!t) return;
    const n = optionalDecimal(raw);
    if (n === null) {
      e[key] = "Enter a valid number.";
      return;
    }
    if (n < 0 || n > 5) e[key] = "Must be between 0 and 5.";
  }

  function validateOptionalDecimal(raw: string, key: FieldKey, e: Partial<Record<FieldKey, string>>) {
    const t = raw.trim();
    if (!t) return;
    const n = optionalDecimal(raw);
    if (n === null) e[key] = "Enter a valid number.";
  }

  function validate(): Partial<Record<FieldKey, string>> {
    const e: Partial<Record<FieldKey, string>> = {};
    const ridErr = validateResidentIdInput(residentIdInput);
    if (ridErr) e.resident_id = ridErr;
    if (!recordDate.trim()) e.record_date = requiredFieldMsg;
    validateOptionalScore0To5(generalHealthScore, "general_health_score", e);
    validateOptionalScore0To5(nutritionScore, "nutrition_score", e);
    validateOptionalScore0To5(sleepQualityScore, "sleep_quality_score", e);
    validateOptionalScore0To5(energyLevelScore, "energy_level_score", e);
    validateOptionalDecimal(heightCm, "height_cm", e);
    validateOptionalDecimal(weightKg, "weight_kg", e);
    validateOptionalDecimal(bmi, "bmi", e);
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
        record_date: recordDate,
        general_health_score: optionalDecimal(generalHealthScore),
        nutrition_score: optionalDecimal(nutritionScore),
        sleep_quality_score: optionalDecimal(sleepQualityScore),
        energy_level_score: optionalDecimal(energyLevelScore),
        height_cm: optionalDecimal(heightCm),
        weight_kg: optionalDecimal(weightKg),
        bmi: optionalDecimal(bmi),
        medical_checkup_done: medicalDone,
        dental_checkup_done: dentalDone,
        psychological_checkup_done: psychDone,
        notes: notes.trim() || null,
      };
      const res = isEdit
        ? await postBeaconJson(`/HealthWellbeingRecord/${existingRecord!.healthRecordId}/Update`, body)
        : await fetch(`${BASE_URL}/HealthWellbeingRecord`, {
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
      const res = await postBeaconJson(
        `/HealthWellbeingRecord/${existingRecord.healthRecordId}/Delete`,
        { resident_id: residentId },
      );
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

  const scoreInput = (
    id: string,
    label: string,
    value: string,
    set: (v: string) => void,
    key: FieldKey,
  ) => (
    <div className="mb-3">
      <label className="form-label small fw-semibold" htmlFor={id}>
        {label}
        {labelSuffix(fieldErrors, key)}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder="Example: 3.5"
        className={`form-control form-control-sm${fieldErrors[key] ? " is-invalid" : ""}`}
        value={value}
        onChange={(e) => set(e.target.value)}
      />
      {fieldErrors[key] ? (
        <div className="invalid-feedback d-block">{fieldErrors[key]}</div>
      ) : null}
    </div>
  );

  const decInput = (
    id: string,
    label: string,
    value: string,
    set: (v: string) => void,
    key: FieldKey,
    placeholder: string,
  ) => (
    <div className="mb-3">
      <label className="form-label small fw-semibold" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        className={`form-control form-control-sm${fieldErrors[key] ? " is-invalid" : ""}`}
        value={value}
        onChange={(e) => set(e.target.value)}
      />
      {fieldErrors[key] ? (
        <div className="invalid-feedback d-block">{fieldErrors[key]}</div>
      ) : null}
    </div>
  );

  return (
    <ResidentRecordModal
      title={isEdit ? "Update Health Record" : "Add Health Record"}
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
          <label className="form-label small fw-semibold" htmlFor="h-resident-id">
            Resident ID
            {labelSuffix(fieldErrors, "resident_id")}
          </label>
          <input
            id="h-resident-id"
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
          <label className="form-label small fw-semibold" htmlFor="h-record-date">
            Record Date
            {labelSuffix(fieldErrors, "record_date")}
          </label>
          <input
            id="h-record-date"
            type="date"
            className={`form-control form-control-sm${fieldErrors.record_date ? " is-invalid" : ""}`}
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
          />
          {fieldErrors.record_date ? (
            <div className="invalid-feedback d-block">{fieldErrors.record_date}</div>
          ) : null}
        </div>

        {scoreInput(
          "h-gen",
          "General Health Score",
          generalHealthScore,
          setGeneralHealthScore,
          "general_health_score",
        )}
        {scoreInput("h-nut", "Nutrition Score", nutritionScore, setNutritionScore, "nutrition_score")}
        {scoreInput(
          "h-sleep",
          "Sleep Quality Score",
          sleepQualityScore,
          setSleepQualityScore,
          "sleep_quality_score",
        )}
        {scoreInput(
          "h-energy",
          "Energy Level Score",
          energyLevelScore,
          setEnergyLevelScore,
          "energy_level_score",
        )}
        {decInput("h-ht", "Height (cm)", heightCm, setHeightCm, "height_cm", "Example: 172")}
        {decInput("h-wt", "Weight (kg)", weightKg, setWeightKg, "weight_kg", "Example: 64.2")}
        {decInput("h-bmi", "BMI", bmi, setBmi, "bmi", "Example: 21.7")}

        <div className="form-check mb-2">
          <input
            id="h-med"
            type="checkbox"
            className="form-check-input"
            checked={medicalDone}
            onChange={(e) => setMedicalDone(e.target.checked)}
          />
          <label className="form-check-label small fw-semibold" htmlFor="h-med">
            Medical Checkup Done
          </label>
        </div>
        <div className="form-check mb-2">
          <input
            id="h-den"
            type="checkbox"
            className="form-check-input"
            checked={dentalDone}
            onChange={(e) => setDentalDone(e.target.checked)}
          />
          <label className="form-check-label small fw-semibold" htmlFor="h-den">
            Dental Checkup Done
          </label>
        </div>
        <div className="form-check mb-3">
          <input
            id="h-psy"
            type="checkbox"
            className="form-check-input"
            checked={psychDone}
            onChange={(e) => setPsychDone(e.target.checked)}
          />
          <label className="form-check-label small fw-semibold" htmlFor="h-psy">
            Psychological Checkup Done
          </label>
        </div>

        <div className="mb-4">
          <label className="form-label small fw-semibold" htmlFor="h-notes">
            Notes
          </label>
          <textarea
            id="h-notes"
            className="form-control form-control-sm"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Example: Brief note (optional)"
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
