import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../config/api";
import type { Partner } from "../types/Partner";
import { AdminDeleteRecordButton } from "../components/admin/AdminDeleteRecordButton";
import {
  CreatePartnerModal,
  type PartnerModalInitial,
} from "../components/admin/AdminCreateEntityModals";
import { useAuth } from "../context/AuthContext";

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
  const { authSession } = useAuth();
  const isAdmin = authSession?.roles.includes("Admin") ?? false;
  const [data, setData] = useState<PartnerPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${BASE_URL}/Partner/${id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Partner not found");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  const reloadPartner = async () => {
    if (!id) return;
    try {
      const res = await fetch(`${BASE_URL}/Partner/${id}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      setData(await res.json());
    } catch {
      /* keep existing */
    }
  };

  const partnerModalInitial = useMemo((): PartnerModalInitial | null => {
    if (!data?.partner) return null;
    const p = data.partner;
    return {
      partnerName: p.partnerName ?? "",
      partnerType: p.partnerType ?? "",
      roleType: p.roleType ?? "",
      email: p.email ?? "",
      phone: p.phone ?? "",
      region: p.region ?? "",
      status: p.status ?? "",
      startDate: p.startDate ?? "",
      notes: p.notes ?? "",
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
    <div className="beacon-page container py-4">
      {isAdmin && partnerModalInitial && id ? (
        <CreatePartnerModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={() => void reloadPartner()}
          editPartnerId={Number(id)}
          initialPartner={partnerModalInitial}
        />
      ) : null}
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <p className="landing-section__eyebrow mb-2">Partner</p>
          <h1 className="mb-0">{partner.partnerName}</h1>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-start">
          {isAdmin ? (
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => setEditOpen(true)}
            >
              Edit partner
            </button>
          ) : null}
          <AdminDeleteRecordButton
            entity="Partner"
            id={id}
            label="Delete partner"
            confirmMessage={`Delete partner "${partner.partnerName}" (ID ${id})? Safehouse assignments will be removed. This cannot be undone.`}
            redirectTo="/admin/all-partners"
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
        <div className="card beacon-detail-card">
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
