import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../config/api";
import type { Partner } from "../types/Partner";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

interface SafehouseAssignment {
  safehouseName: string;
  safehouseCity?: string;
  programArea?: string;
  status?: string;
}

interface PartnerPageData {
  partner: Partner;
  safehouseAssignments: SafehouseAssignment[];
}

function PartnerPage() {
  const { id } = useParams();
  const [data, setData] = useState<PartnerPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${BASE_URL}/Partner/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Partner not found");
        return res.json();
      })
      .then(setData)
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

  if (error || !data) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error ?? "Partner not found."}</div>
      </div>
    );
  }

  const { partner, safehouseAssignments } = data;

  const fields: [string, string | undefined | null][] = [
    ["Role", partner.roleType],
    ["Email", partner.email],
    ["Phone", partner.phone],
    ["Region", partner.region],
    ["Status", partner.status],
    ["Start Date", partner.startDate ? formatDate(partner.startDate) : null],
    ["End Date", partner.endDate ? formatDate(partner.endDate) : null],
  ];

  return (
    <div className="container py-4">
      <h1 className="mb-4">{partner.partnerName}</h1>

      <div className="card mb-4">
        <div className="card-body">
          <table className="table table-sm mb-0">
            <tbody>
              {fields
                .filter(([, value]) => value != null && value !== "")
                .map(([label, value]) => (
                  <tr key={label}><th>{label}</th><td>{value}</td></tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="h5 mb-3">Safehouse Assignments</h2>
      {safehouseAssignments.length === 0 ? (
        <div className="alert alert-secondary">No safehouse assignments found.</div>
      ) : (
        <div className="card">
          <div className="card-body">
            <table className="table table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Safehouse</th>
                  <th>City</th>
                  <th>Program Area</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {safehouseAssignments.map((a, i) => (
                  <tr key={i}>
                    <td>{a.safehouseName}</td>
                    <td>{a.safehouseCity ?? "N/A"}</td>
                    <td>{a.programArea ?? "N/A"}</td>
                    <td>{a.status ?? "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PartnerPage;
