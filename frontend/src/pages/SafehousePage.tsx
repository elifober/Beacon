import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../config/api";
import type { Safehouse } from "../types/Safehouse";

interface SafehousePageData {
  safehouse: Safehouse;
  assignedPartners: string[];
}

function SafehousePage() {
  const { id } = useParams();
  const [data, setData] = useState<SafehousePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${BASE_URL}/Safehouse/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Safehouse not found");
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
        <div className="alert alert-danger">{error ?? "Safehouse not found."}</div>
      </div>
    );
  }

  const { safehouse, assignedPartners } = data;

  const fields: [string, string | number | undefined | null][] = [
    ["City", safehouse.city],
    ["Region", safehouse.region],
    ["Province", safehouse.province],
    ["Country", safehouse.country],
    ["Status", safehouse.status],
    ["Capacity (Girls)", safehouse.capacityGirls],
    ["Current Occupancy", safehouse.currentOccupancy],
  ];

  return (
    <div className="container py-4">
      <h1 className="mb-4">{safehouse.name}</h1>

      <div className="card mb-4">
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

      <h2 className="h5 mb-3">Assigned Partners</h2>
      {assignedPartners.length === 0 ? (
        <div className="alert alert-secondary">No partners assigned.</div>
      ) : (
        <ul className="list-group">
          {assignedPartners.map((name) => (
            <li key={name} className="list-group-item">{name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SafehousePage;
