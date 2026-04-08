import { useEffect, useState } from "react";
import type { ResidentList } from "../types/ResidentList";
import { getResidentList } from "../api/Residents";

function ResidentListComponent() {
  const [residents, setResidents] = useState<ResidentList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getResidentList();
        setResidents(data);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading residents…</span>
        </div>
        <p className="text-muted small mt-3 mb-0">Loading residents…</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  if (residents.length === 0) {
    return (
      <div className="alert alert-secondary shadow-sm mb-0" role="status">
        No residents found.
      </div>
    );
  }

  return (
    <table className="table table-striped table-hover">
      <thead>
        <tr>
          <th>Name</th>
          <th>Safehouse</th>
          <th>Case Status</th>
          <th>Sex</th>
          <th>Date of Birth</th>
        </tr>
      </thead>
      <tbody>
        {residents.map((r) => (
          <tr key={r.residentId}>
            <td>{r.name}</td>
            <td>{r.safehouseName}</td>
            <td>{r.caseStatus ?? "N/A"}</td>
            <td>{r.sex ?? "N/A"}</td>
            <td>{r.dateOfBirth ?? "N/A"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ResidentListComponent;
