import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../config/api";
import type { Safehouse } from "../types/Safehouse";
import { AdminDeleteRecordButton } from "../components/admin/AdminDeleteRecordButton";
import {
  CreateSafehouseModal,
  type SafehouseModalInitial,
} from "../components/admin/AdminCreateEntityModals";

interface SafehousePageData {
  safehouse: Safehouse;
  assignedPartners: string[];
}

function SafehousePage() {
  const { id } = useParams();
  const [data, setData] = useState<SafehousePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${BASE_URL}/Safehouse/${id}`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then((res) => {
        if (res.status === 401) throw new Error("Sign in as an admin to view this safehouse.");
        if (!res.ok) throw new Error("Safehouse not found");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  const reloadSafehouse = async () => {
    if (!id) return;
    try {
      const res = await fetch(`${BASE_URL}/Safehouse/${id}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return;
      setData(await res.json());
    } catch {
      /* keep existing */
    }
  };

  const safehouseModalInitial = useMemo((): SafehouseModalInitial | null => {
    if (!data?.safehouse) return null;
    const s = data.safehouse;
    return {
      name: s.name ?? "",
      region: s.region ?? "",
      city: s.city ?? "",
      province: s.province ?? "",
      country: s.country ?? "",
      openDate: s.openDate ?? "",
      status: s.status ?? "",
      capacityGirls:
        s.capacityGirls != null ? String(s.capacityGirls) : "",
      capacityStaff:
        s.capacityStaff != null ? String(s.capacityStaff) : "",
      currentOccupancy:
        s.currentOccupancy != null ? String(s.currentOccupancy) : "",
    };
  }, [data]);

  if (loading) {
    return (
      <div className="beacon-page beacon-page--loading text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="beacon-page container py-4">
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
    <div className="beacon-page container py-4">
      {safehouseModalInitial && id ? (
        <CreateSafehouseModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={() => void reloadSafehouse()}
          editSafehouseId={Number(id)}
          initialSafehouse={safehouseModalInitial}
        />
      ) : null}
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <p className="landing-section__eyebrow mb-2">Safehouse</p>
          <h1 className="mb-0">{safehouse.name}</h1>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-start">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => setEditOpen(true)}
          >
            Edit safehouse
          </button>
          <AdminDeleteRecordButton
            entity="Safehouse"
            id={id}
            label="Delete safehouse"
            confirmMessage={`Delete safehouse "${safehouse.name}" (ID ${id})? Depending on the database, related residents and other rows may be removed too. This cannot be undone.`}
            redirectTo="/admin/all-safehouses"
          />
        </div>
      </div>

      <div className="card beacon-detail-card mb-4">
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
