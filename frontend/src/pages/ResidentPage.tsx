import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../config/api";
import type { ResidentDetail } from "../types/residentRecords";
import { dashIfEmpty, formatDate } from "../components/resident/residentRecordFormat";
import SearchBar from "../components/SearchBar";
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

function ResidentPage() {
  const { id } = useParams();
  const [resident, setResident] = useState<ResidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openResidentMenu, setOpenResidentMenu] = useState<
    "risk" | "safehouse" | "time-housed" | "age" | null
  >(null);

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

  return (
    <div className="beacon-page container py-4">
      <p className="landing-section__eyebrow mb-2">Resident</p>
      <div className="admin-dashboard__search-wrap resident-page__search-wrap mb-3">
        <SearchBar maxWidth={760} inputClassName="rounded-pill px-4 py-2" />
      </div>

      <section className="resident-glass-menu-wrap mb-4" aria-label="Resident quick details">
        <div className="resident-glass-menu">
          <button
            type="button"
            className={`resident-glass-menu__tab ${openResidentMenu === "risk" ? "is-open" : ""}`}
            aria-expanded={openResidentMenu === "risk"}
            aria-controls="resident-glass-menu-risk"
            onClick={() =>
              setOpenResidentMenu((prev) => (prev === "risk" ? null : "risk"))
            }
          >
            Risk
            <i className={`bi ${openResidentMenu === "risk" ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`resident-glass-menu__tab ${openResidentMenu === "safehouse" ? "is-open" : ""}`}
            aria-expanded={openResidentMenu === "safehouse"}
            aria-controls="resident-glass-menu-safehouse"
            onClick={() =>
              setOpenResidentMenu((prev) => (prev === "safehouse" ? null : "safehouse"))
            }
          >
            Safehouse
            <i className={`bi ${openResidentMenu === "safehouse" ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`resident-glass-menu__tab ${openResidentMenu === "time-housed" ? "is-open" : ""}`}
            aria-expanded={openResidentMenu === "time-housed"}
            aria-controls="resident-glass-menu-time-housed"
            onClick={() =>
              setOpenResidentMenu((prev) => (prev === "time-housed" ? null : "time-housed"))
            }
          >
            Time Housed
            <i className={`bi ${openResidentMenu === "time-housed" ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`resident-glass-menu__tab ${openResidentMenu === "age" ? "is-open" : ""}`}
            aria-expanded={openResidentMenu === "age"}
            aria-controls="resident-glass-menu-age"
            onClick={() =>
              setOpenResidentMenu((prev) => (prev === "age" ? null : "age"))
            }
          >
            Age
            <i className={`bi ${openResidentMenu === "age" ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true" />
          </button>
        </div>

        {openResidentMenu ? (
          <div className="resident-glass-menu__dropdown" role="region" aria-live="polite">
            {openResidentMenu === "risk" ? (
              <div id="resident-glass-menu-risk" className="resident-glass-menu__grid">
                <article className="resident-glass-menu__item">
                  <p className="resident-glass-menu__label">Current risk level</p>
                  <p className="resident-glass-menu__value mb-0">{dashIfEmpty(resident.currentRiskLevel)}</p>
                </article>
                <article className="resident-glass-menu__item">
                  <p className="resident-glass-menu__label">Case status</p>
                  <p className="resident-glass-menu__value mb-0">{dashIfEmpty(resident.caseStatus)}</p>
                </article>
              </div>
            ) : null}

            {openResidentMenu === "safehouse" ? (
              <div id="resident-glass-menu-safehouse" className="resident-glass-menu__grid">
                <article className="resident-glass-menu__item">
                  <p className="resident-glass-menu__label">City</p>
                  <p className="resident-glass-menu__value mb-0">{dashIfEmpty(resident.safehouseCity)}</p>
                </article>
                <article className="resident-glass-menu__item">
                  <p className="resident-glass-menu__label">Safehouse ID</p>
                  <p className="resident-glass-menu__value mb-0">{dashIfEmpty(String(resident.safehouseId ?? ""))}</p>
                </article>
              </div>
            ) : null}

            {openResidentMenu === "time-housed" ? (
              <div id="resident-glass-menu-time-housed" className="resident-glass-menu__grid">
                <article className="resident-glass-menu__item">
                  <p className="resident-glass-menu__label">Length of stay</p>
                  <p className="resident-glass-menu__value mb-0">{dashIfEmpty(resident.lengthOfStay)}</p>
                </article>
                <article className="resident-glass-menu__item">
                  <p className="resident-glass-menu__label">Resident</p>
                  <p className="resident-glass-menu__value mb-0">{dashIfEmpty(resident.name)}</p>
                </article>
              </div>
            ) : null}

            {openResidentMenu === "age" ? (
              <div id="resident-glass-menu-age" className="resident-glass-menu__grid">
                <article className="resident-glass-menu__item">
                  <p className="resident-glass-menu__label">Age</p>
                  <p className="resident-glass-menu__value mb-0">{ageDisplay}</p>
                </article>
                <article className="resident-glass-menu__item">
                  <p className="resident-glass-menu__label">Date of birth</p>
                  <p className="resident-glass-menu__value mb-0">{dobDisplay}</p>
                </article>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

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
