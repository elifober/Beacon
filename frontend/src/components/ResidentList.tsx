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
    <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
      {residents.map((r) => (
        <div key={r.residentId} className="col">
          <div className="card h-100 shadow-sm">
            <div className="card-body d-flex flex-column">
              <h3 className="card-title h5">Resident #{r.residentId}</h3>
              <p className="card-text small mb-1">
                <strong>Safehouse ID:</strong> {r.safehouseId}
              </p>
              <p className="card-text small mb-1">
                <strong>Case Status:</strong> {r.caseStatus ?? "N/A"}
              </p>
              <p className="card-text small mb-1">
                <strong>Sex:</strong> {r.sex ?? "N/A"}
              </p>
              <p className="card-text small mb-1">
                <strong>Date of Birth:</strong> {r.dateOfBirth ?? "N/A"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ResidentListComponent;
