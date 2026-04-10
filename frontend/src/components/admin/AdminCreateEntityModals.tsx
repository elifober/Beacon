import { type FormEvent, useEffect, useMemo, useState } from "react";
import { BASE_URL } from "../../config/api";
import { createResident, type ResidentInput } from "../../api/Residents";
import type { Safehouse } from "../../types/Safehouse";
import {
  ENTITY_ACTIVE_INACTIVE_OPTIONS,
  PARTNER_ROLE_TYPE_OPTIONS,
  PARTNER_TYPE_OPTIONS,
  SUPPORTER_ACQUISITION_CHANNEL_OPTIONS,
  SUPPORTER_RELATIONSHIP_OPTIONS,
  SUPPORTER_TYPE_OPTIONS,
} from "../../constants/adminEntityCreateForm";
import {
  RESIDENT_CASE_STATUS_OPTIONS,
  RESIDENT_RISK_LEVEL_OPTIONS,
} from "../../constants/residentCreateForm";
import { ResidentRecordModal } from "../resident/ResidentRecordModal";
import {
  messageFromJsonPayload,
  postBeaconJson,
  readResponseJson,
} from "../resident/residentRecordFormUtils";

const emptyResidentForm: ResidentInput = {
  firstName: "",
  lastInitial: "",
  caseControlNo: "",
  internalCode: "",
  safehouseId: 0,
  caseStatus: "",
  sex: "",
  dateOfBirth: "",
  initialRiskLevel: "",
  currentRiskLevel: "",
};

function safehouseCityOptionLabel(s: Safehouse): string {
  const city = (s.city ?? "").trim();
  const name = (s.name ?? "").trim();
  const code = (s.safehouseCode ?? "").trim();
  if (city) {
    const extra =
      name && name.toLowerCase() !== city.toLowerCase() ? ` — ${name}` : "";
    return `${city}${extra}`;
  }
  if (name) return name;
  return code || `Safehouse ${s.safehouseId}`;
}

type ModalShellProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function CreateResidentModal({ open, onClose, onCreated }: ModalShellProps) {
  const [safehouses, setSafehouses] = useState<Safehouse[]>([]);
  const [form, setForm] = useState<ResidentInput>(emptyResidentForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safehousesSorted = useMemo(() => {
    return [...safehouses].sort((a, b) => {
      const labelA = safehouseCityOptionLabel(a);
      const labelB = safehouseCityOptionLabel(b);
      const byLabel = labelA.localeCompare(labelB, undefined, { sensitivity: "base" });
      if (byLabel !== 0) return byLabel;
      return a.safehouseId - b.safehouseId;
    });
  }, [safehouses]);

  useEffect(() => {
    if (!open) return;
    setForm(emptyResidentForm);
    setError(null);
    fetch(`${BASE_URL}/Safehouses`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: Safehouse[]) => setSafehouses(Array.isArray(data) ? data : []))
      .catch(() => setSafehouses([]));
  }, [open]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.safehouseId || form.safehouseId <= 0) {
      setError("Choose a safehouse (by city).");
      return;
    }
    if (!form.caseStatus.trim()) {
      setError("Choose a status.");
      return;
    }
    if (form.sex !== "M" && form.sex !== "F") {
      setError("Select sex (M or F).");
      return;
    }
    setSubmitting(true);
    try {
      await createResident(form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create resident.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResidentRecordModal title="New resident" open={open} onClose={onClose} narrow>
      <form className="p-4" onSubmit={onSubmit}>
        {error ? <div className="alert alert-danger py-2">{error}</div> : null}

        <div className="mb-3">
          <label className="form-label" htmlFor="create-res-id">
            Resident ID
          </label>
          <input
            id="create-res-id"
            name="create-res-id"
            type="text"
            className="form-control"
            readOnly
            disabled
            value=""
            placeholder="Assigned on save"
            autoComplete="off"
            aria-describedby="create-res-id-help"
          />
          <div id="create-res-id-help" className="form-text">
            The next id is assigned on the server when you save (sequential key — not entered here).
          </div>
        </div>

        <div className="row g-3 mb-2">
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-res-fn">
              First name
            </label>
            <input
              id="create-res-fn"
              name="create-res-fn"
              className="form-control"
              autoComplete="given-name"
              value={form.firstName}
              onChange={(e) =>
                setForm((f) => ({ ...f, firstName: e.target.value }))
              }
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-res-li">
              Last initial
            </label>
            <input
              id="create-res-li"
              name="create-res-li"
              className="form-control"
              autoComplete="family-name"
              maxLength={8}
              value={form.lastInitial}
              onChange={(e) =>
                setForm((f) => ({ ...f, lastInitial: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="row g-3 mb-2">
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-res-cc">
              Case control number
            </label>
            <input
              id="create-res-cc"
              name="create-res-cc"
              className="form-control"
              autoComplete="off"
              value={form.caseControlNo}
              onChange={(e) =>
                setForm((f) => ({ ...f, caseControlNo: e.target.value }))
              }
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-res-ic">
              Internal code
            </label>
            <input
              id="create-res-ic"
              name="create-res-ic"
              className="form-control"
              autoComplete="off"
              value={form.internalCode}
              onChange={(e) =>
                setForm((f) => ({ ...f, internalCode: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="create-res-sh">
            Safehouse (city)
          </label>
          <select
            id="create-res-sh"
            name="create-res-sh"
            className="form-select"
            required
            value={form.safehouseId || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, safehouseId: Number(e.target.value) }))
            }
          >
            <option value="">Select city / safehouse…</option>
            {safehousesSorted.map((s) => (
              <option key={s.safehouseId} value={s.safehouseId}>
                {safehouseCityOptionLabel(s)}
              </option>
            ))}
          </select>
          <div className="form-text">The value saved to the database is the safehouse ID.</div>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="create-res-cs">
            Status
          </label>
          <select
            id="create-res-cs"
            name="create-res-cs"
            className="form-select"
            required
            value={form.caseStatus}
            onChange={(e) =>
              setForm((f) => ({ ...f, caseStatus: e.target.value }))
            }
          >
            <option value="" disabled>
              Select status…
            </option>
            {RESIDENT_CASE_STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="mb-3">
          <legend className="form-label mb-2">Sex</legend>
          <div className="d-flex flex-wrap gap-3">
            <div className="form-check">
              <input
                id="create-res-sex-m"
                name="create-res-sex"
                type="radio"
                className="form-check-input"
                checked={form.sex === "M"}
                onChange={() => setForm((f) => ({ ...f, sex: "M" }))}
              />
              <label className="form-check-label" htmlFor="create-res-sex-m">
                M
              </label>
            </div>
            <div className="form-check">
              <input
                id="create-res-sex-f"
                name="create-res-sex"
                type="radio"
                className="form-check-input"
                checked={form.sex === "F"}
                onChange={() => setForm((f) => ({ ...f, sex: "F" }))}
              />
              <label className="form-check-label" htmlFor="create-res-sex-f">
                F
              </label>
            </div>
          </div>
        </fieldset>

        <div className="mb-3">
          <label className="form-label" htmlFor="create-res-dob">
            Date of birth
          </label>
          <input
            id="create-res-dob"
            name="create-res-dob"
            type="date"
            className="form-control"
            autoComplete="bday"
            value={form.dateOfBirth?.slice(0, 10) ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, dateOfBirth: e.target.value }))
            }
          />
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-res-risk-i">
              Initial risk
            </label>
            <select
              id="create-res-risk-i"
              name="create-res-risk-i"
              className="form-select"
              value={form.initialRiskLevel}
              onChange={(e) =>
                setForm((f) => ({ ...f, initialRiskLevel: e.target.value }))
              }
            >
              <option value="">—</option>
              {RESIDENT_RISK_LEVEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-res-risk-c">
              Current risk
            </label>
            <select
              id="create-res-risk-c"
              name="create-res-risk-c"
              className="form-select"
              value={form.currentRiskLevel}
              onChange={(e) =>
                setForm((f) => ({ ...f, currentRiskLevel: e.target.value }))
              }
            >
              <option value="">—</option>
              {RESIDENT_RISK_LEVEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="d-flex gap-2 justify-content-end">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : "Create resident"}
          </button>
        </div>
      </form>
    </ResidentRecordModal>
  );
}

export function CreatePartnerModal({ open, onClose, onCreated }: ModalShellProps) {
  const [partnerName, setPartnerName] = useState("");
  const [partnerType, setPartnerType] = useState("");
  const [roleType, setRoleType] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPartnerName("");
    setPartnerType("");
    setRoleType("");
    setEmail("");
    setPhone("");
    setRegion("");
    setStatus("");
    setStartDate("");
    setNotes("");
    setError(null);
  }, [open]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!partnerName.trim()) {
      setError("Partner name is required.");
      return;
    }
    if (!status) {
      setError("Choose Active or Inactive.");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        partnerName: partnerName.trim(),
        partnerType: partnerType.trim() || null,
        roleType: roleType.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        region: region.trim() || null,
        status: status.trim() || null,
        startDate: startDate.trim() || null,
        notes: notes.trim() || null,
      };
      const res = await postBeaconJson("Partners", body);
      const { payload } = await readResponseJson(res);
      if (!res.ok) {
        setError(messageFromJsonPayload(payload, `Request failed (${res.status})`));
        return;
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create partner.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResidentRecordModal title="New partner" open={open} onClose={onClose} narrow>
      <form className="p-4" onSubmit={onSubmit}>
        {error ? <div className="alert alert-danger py-2">{error}</div> : null}
        <div className="mb-3">
          <label className="form-label" htmlFor="create-par-id">
            Partner ID
          </label>
          <input
            id="create-par-id"
            name="create-par-id"
            type="text"
            className="form-control"
            readOnly
            disabled
            value=""
            placeholder="Assigned on save"
            autoComplete="off"
          />
          <div className="form-text">The database assigns the next partner id when you save.</div>
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="create-par-name">
            Partner name <span className="text-danger">*</span>
          </label>
          <input
            id="create-par-name"
            name="create-par-name"
            className="form-control"
            required
            autoComplete="organization"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
          />
          <div className="form-text">Contact name in the database is set to match partner name.</div>
        </div>
        <div className="row g-2 mb-2">
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-par-ptype">
              Partner type
            </label>
            <select
              id="create-par-ptype"
              name="create-par-ptype"
              className="form-select"
              value={partnerType}
              onChange={(e) => setPartnerType(e.target.value)}
            >
              <option value="">—</option>
              {PARTNER_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-par-role">
              Role type
            </label>
            <select
              id="create-par-role"
              name="create-par-role"
              className="form-select"
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
            >
              <option value="">—</option>
              {PARTNER_ROLE_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="row g-2 mb-2">
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-par-email">
              Email
            </label>
            <input
              id="create-par-email"
              name="create-par-email"
              type="email"
              className="form-control"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-par-phone">
              Phone
            </label>
            <input
              id="create-par-phone"
              name="create-par-phone"
              className="form-control"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
        <div className="row g-2 mb-2">
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-par-region">
              Region
            </label>
            <input
              id="create-par-region"
              name="create-par-region"
              className="form-control"
              autoComplete="address-level1"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-par-status">
              Status <span className="text-danger">*</span>
            </label>
            <select
              id="create-par-status"
              name="create-par-status"
              className="form-select"
              required
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="" disabled>
                Select status…
              </option>
              {ENTITY_ACTIVE_INACTIVE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="create-par-start">
            Start date
          </label>
          <input
            id="create-par-start"
            name="create-par-start"
            type="date"
            className="form-control"
            autoComplete="off"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="create-par-notes">
            Notes
          </label>
          <textarea
            id="create-par-notes"
            name="create-par-notes"
            className="form-control"
            rows={2}
            autoComplete="off"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="d-flex gap-2 justify-content-end">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : "Create partner"}
          </button>
        </div>
      </form>
    </ResidentRecordModal>
  );
}

export function CreateSafehouseModal({ open, onClose, onCreated }: ModalShellProps) {
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [status, setStatus] = useState("");
  const [capacityGirls, setCapacityGirls] = useState("");
  const [capacityStaff, setCapacityStaff] = useState("");
  const [currentOccupancy, setCurrentOccupancy] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setRegion("");
    setCity("");
    setProvince("");
    setCountry("");
    setOpenDate("");
    setStatus("");
    setCapacityGirls("");
    setCapacityStaff("");
    setCurrentOccupancy("");
    setError(null);
  }, [open]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!status) {
      setError("Choose Active or Inactive.");
      return;
    }
    const capG = capacityGirls.trim() ? Number(capacityGirls) : null;
    const capS = capacityStaff.trim() ? Number(capacityStaff) : null;
    const occ = currentOccupancy.trim() ? Number(currentOccupancy) : null;
    if (capacityGirls.trim() && !Number.isInteger(capG)) {
      setError("Capacity must be a whole number.");
      return;
    }
    if (capacityStaff.trim() && !Number.isInteger(capS)) {
      setError("Staff capacity must be a whole number.");
      return;
    }
    if (currentOccupancy.trim() && !Number.isInteger(occ)) {
      setError("Current occupancy must be a whole number.");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        name: name.trim(),
        region: region.trim() || null,
        city: city.trim() || null,
        province: province.trim() || null,
        country: country.trim() || null,
        openDate: openDate.trim() || null,
        status: status.trim() || null,
        capacityGirls: capG,
        capacityStaff: capS,
        currentOccupancy: occ,
      };
      const res = await postBeaconJson("Safehouses", body);
      const { payload } = await readResponseJson(res);
      if (!res.ok) {
        setError(messageFromJsonPayload(payload, `Request failed (${res.status})`));
        return;
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create safehouse.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResidentRecordModal title="New safehouse" open={open} onClose={onClose} narrow>
      <form className="p-4" onSubmit={onSubmit}>
        {error ? <div className="alert alert-danger py-2">{error}</div> : null}
        <div className="mb-3">
          <label className="form-label" htmlFor="create-sh-id">
            Safehouse ID
          </label>
          <input
            id="create-sh-id"
            name="create-sh-id"
            type="text"
            className="form-control"
            readOnly
            disabled
            value=""
            placeholder="Assigned on save"
            autoComplete="off"
          />
          <div className="form-text">
            Safehouse code is assigned on save (e.g. SH-12 for id 12).
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="create-sh-name">
            Name <span className="text-danger">*</span>
          </label>
          <input
            id="create-sh-name"
            name="create-sh-name"
            className="form-control"
            required
            autoComplete="organization"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="row g-2 mb-2">
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-sh-region">
              Region
            </label>
            <input
              id="create-sh-region"
              name="create-sh-region"
              className="form-control"
              autoComplete="address-level1"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-sh-city">
              City
            </label>
            <input
              id="create-sh-city"
              name="create-sh-city"
              className="form-control"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>
        <div className="row g-2 mb-2">
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-sh-prov">
              Province
            </label>
            <input
              id="create-sh-prov"
              name="create-sh-prov"
              className="form-control"
              autoComplete="address-level1"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-sh-country">
              Country
            </label>
            <input
              id="create-sh-country"
              name="create-sh-country"
              className="form-control"
              autoComplete="country-name"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>
        <div className="row g-2 mb-2">
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-sh-open">
              Open date
            </label>
            <input
              id="create-sh-open"
              name="create-sh-open"
              type="date"
              className="form-control"
              autoComplete="off"
              value={openDate}
              onChange={(e) => setOpenDate(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-sh-status">
              Status <span className="text-danger">*</span>
            </label>
            <select
              id="create-sh-status"
              name="create-sh-status"
              className="form-select"
              required
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="" disabled>
                Select status…
              </option>
              {ENTITY_ACTIVE_INACTIVE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="row g-2 mb-2">
          <div className="col-md-4">
            <label className="form-label" htmlFor="create-sh-capg">
              Capacity
            </label>
            <input
              id="create-sh-capg"
              name="create-sh-capg"
              inputMode="numeric"
              className="form-control"
              autoComplete="off"
              value={capacityGirls}
              onChange={(e) => setCapacityGirls(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="create-sh-caps">
              Capacity (staff)
            </label>
            <input
              id="create-sh-caps"
              name="create-sh-caps"
              inputMode="numeric"
              className="form-control"
              autoComplete="off"
              value={capacityStaff}
              onChange={(e) => setCapacityStaff(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="create-sh-occ">
              Current occupancy
            </label>
            <input
              id="create-sh-occ"
              name="create-sh-occ"
              inputMode="numeric"
              className="form-control"
              autoComplete="off"
              value={currentOccupancy}
              onChange={(e) => setCurrentOccupancy(e.target.value)}
            />
          </div>
        </div>
        <div className="d-flex gap-2 justify-content-end">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : "Create safehouse"}
          </button>
        </div>
      </form>
    </ResidentRecordModal>
  );
}

export function CreateDonorModal({ open, onClose, onCreated }: ModalShellProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [supporterType, setSupporterType] = useState("");
  const [relationshipType, setRelationshipType] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("Active");
  const [acquisitionChannel, setAcquisitionChannel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFirstName("");
    setLastName("");
    setSupporterType("");
    setRelationshipType("");
    setRegion("");
    setEmail("");
    setPhone("");
    setStatus("Active");
    setAcquisitionChannel("");
    setError(null);
  }, [open]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    if (!status) {
      setError("Choose Active or Inactive.");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        supporterType: supporterType.trim() || null,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        relationshipType: relationshipType.trim() || null,
        region: region.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        status: status.trim() || null,
        acquisitionChannel: acquisitionChannel.trim() || null,
      };
      const res = await postBeaconJson("Supporters", body);
      const { payload } = await readResponseJson(res);
      if (!res.ok) {
        setError(messageFromJsonPayload(payload, `Request failed (${res.status})`));
        return;
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create donor.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResidentRecordModal title="New donor" open={open} onClose={onClose} narrow>
      <form className="p-4" onSubmit={onSubmit}>
        {error ? <div className="alert alert-danger py-2">{error}</div> : null}
        <p className="small text-muted mb-3">
          Creates a row in <code>supporters</code>. Donor user accounts still use the sign-up flow;
          this is for offline or admin-entered records.
        </p>
        <div className="mb-3">
          <label className="form-label" htmlFor="create-don-id">
            Supporter ID
          </label>
          <input
            id="create-don-id"
            name="create-don-id"
            type="text"
            className="form-control"
            readOnly
            disabled
            value=""
            placeholder="Assigned on save"
            autoComplete="off"
          />
          <div className="form-text">
            Display name is saved as first + last name. <code>created_at</code> is set on the server.
          </div>
        </div>
        <div className="row g-2 mb-2">
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-don-fn">
              First name <span className="text-danger">*</span>
            </label>
            <input
              id="create-don-fn"
              name="create-don-fn"
              className="form-control"
              required
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-don-ln">
              Last name <span className="text-danger">*</span>
            </label>
            <input
              id="create-don-ln"
              name="create-don-ln"
              className="form-control"
              required
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <div className="row g-2 mb-2">
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-don-stype">
              Supporter type
            </label>
            <select
              id="create-don-stype"
              name="create-don-stype"
              className="form-select"
              value={supporterType}
              onChange={(e) => setSupporterType(e.target.value)}
            >
              <option value="">—</option>
              {SUPPORTER_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-don-rel">
              Relationship
            </label>
            <select
              id="create-don-rel"
              name="create-don-rel"
              className="form-select"
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
            >
              <option value="">—</option>
              {SUPPORTER_RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="create-don-region">
            Region
          </label>
          <input
            id="create-don-region"
            name="create-don-region"
            className="form-control"
            autoComplete="address-level1"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
        </div>
        <div className="row g-2 mb-2">
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-don-email">
              Email
            </label>
            <input
              id="create-don-email"
              name="create-don-email"
              type="email"
              className="form-control"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-don-phone">
              Phone
            </label>
            <input
              id="create-don-phone"
              name="create-don-phone"
              className="form-control"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
        <div className="row g-2 mb-2">
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-don-status">
              Status <span className="text-danger">*</span>
            </label>
            <select
              id="create-don-status"
              name="create-don-status"
              className="form-select"
              required
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {ENTITY_ACTIVE_INACTIVE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="create-don-acq">
              Acquisition channel
            </label>
            <select
              id="create-don-acq"
              name="create-don-acq"
              className="form-select"
              value={acquisitionChannel}
              onChange={(e) => setAcquisitionChannel(e.target.value)}
            >
              <option value="">—</option>
              {SUPPORTER_ACQUISITION_CHANNEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="d-flex gap-2 justify-content-end">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : "Create donor"}
          </button>
        </div>
      </form>
    </ResidentRecordModal>
  );
}
