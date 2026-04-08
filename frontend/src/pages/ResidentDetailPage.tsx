import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../config/api";
import type { Resident } from "../types/Resident";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

function ResidentDetailPage() {
  const { id } = useParams();
  const [resident, setResident] = useState<Resident | null>(null);
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

  const fields: [string, string | number | boolean | undefined | null][] = [
    ["Name", [resident.firstName, resident.lastInitial].filter(Boolean).join(" ") || null],
    ["Case Control No", resident.caseControlNo],
    ["Internal Code", resident.internalCode],
    ["Case Status", resident.caseStatus],
    ["Sex", resident.sex],
    ["Date of Birth", resident.dateOfBirth ? formatDate(resident.dateOfBirth) : null],
    ["Present Age", resident.presentAge],
    ["Date of Admission", resident.dateOfAdmission ? formatDate(resident.dateOfAdmission) : null],
    ["Age Upon Admission", resident.ageUponAdmission],
    ["Place of Birth", resident.placeOfBirth],
    ["Religion", resident.religion],
    ["Case Category", resident.caseCategory],
    ["Risk Level", resident.currentRiskLevel],
    ["Assigned Social Worker", resident.assignedSocialWorker],
    ["Reintegration Status", resident.reintegrationStatus],
    ["Length of Stay", resident.lengthOfStay],
  ];

  return (
    <div className="container py-4">
      <h1 className="mb-4">Resident Details</h1>
      <div className="card">
        <div className="card-body">
          <table className="table table-sm mb-0">
            <tbody>
              {fields
                .filter(([, value]) => value != null && value !== "")
                .map(([label, value]) => (
                  <tr key={label}><th>{label}</th><td>{String(value)}</td></tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ResidentDetailPage;
