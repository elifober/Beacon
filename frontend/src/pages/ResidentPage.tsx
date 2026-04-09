import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../config/api";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
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

interface ResidentDetail {
  name: string;
  dateOfBirth?: string;
  sex?: string;
  caseStatus?: string;
  safehouseCity?: string;
  lengthOfStay?: string;
  currentRiskLevel?: string;
}

function ResidentPage() {
  const { id } = useParams();
  const [resident, setResident] = useState<ResidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !resident) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error ?? "Resident not found."}</div>
      </div>
    );
  }

  const dobDisplay = resident.dateOfBirth
    ? formatDate(resident.dateOfBirth)
    : "\u2014";
  const ageDisplay = resident.dateOfBirth
    ? String(calculateAge(resident.dateOfBirth))
    : "\u2014";

  return (
    <div className="container py-4">
      <div className="row g-4 align-items-stretch">
        <div className="col-lg-4">
          <div className="card h-100 shadow-sm">
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
        </div>

        <div className="col-lg-8">
          <div className="row g-3 h-100">
            <div className="col-md-4 d-flex">
              <div className="card flex-grow-1 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <p className="text-muted small mb-2 mb-md-3">Safehouse</p>
                  <p className="mb-0 fs-5 fw-semibold mt-auto">
                    {dashIfEmpty(resident.safehouseCity)}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4 d-flex">
              <div className="card flex-grow-1 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <p className="text-muted small mb-2 mb-md-3">Time Housed</p>
                  <p className="mb-0 fs-5 fw-semibold mt-auto">
                    {dashIfEmpty(resident.lengthOfStay)}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4 d-flex">
              <div className="card flex-grow-1 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <p className="text-muted small mb-2 mb-md-3">Risk Level</p>
                  <p className="mb-0 fs-5 fw-semibold mt-auto">
                    {dashIfEmpty(resident.currentRiskLevel)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResidentPage;
