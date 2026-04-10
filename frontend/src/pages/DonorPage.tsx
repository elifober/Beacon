import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../config/api";
import type { Supporter } from "../types/Supporter";
import type { DonorDashboard } from "../types/DonorDashboard";
import { AdminDeleteRecordButton } from "../components/admin/AdminDeleteRecordButton";
import {
  EditDonorModal,
  type DonorModalInitial,
} from "../components/admin/AdminCreateEntityModals";
import { useAuth } from "../context/AuthContext";
import BeaconLoadingMark from "../components/BeaconLoadingMark.tsx";
import { DonorDashboardLayout } from "../components/donor/DonorDashboardLayout";
import AdminDashboardBackLink from "../components/AdminDashboardBackLink";

interface DonorFullHistoryItem {
  donationType?: string;
  donationDate: string;
  amount?: number;
  estimatedValue?: number;
  impactUnit?: string;
  notes?: string;
  programArea?: string;
}

interface DonorPageData {
  supporter: Supporter;
  donationHistory: DonorFullHistoryItem[];
}

function mapToDonorDashboard(data: DonorPageData): DonorDashboard {
  return {
    supporter: data.supporter,
    donationHistory: data.donationHistory.map((h) => ({
      donationType: h.donationType,
      donationDate: h.donationDate,
      amount: h.amount,
      estimatedValue: h.estimatedValue,
      impactUnit: h.impactUnit,
      programArea: h.programArea?.trim() || "Unspecified",
    })),
  };
}

function DonorPage() {
  const { id } = useParams();
  const { authSession } = useAuth();
  const isAdmin = authSession?.roles.includes("Admin") ?? false;
  const [data, setData] = useState<DonorPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${BASE_URL}/Donor/${id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Donor not found");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  const reloadDonor = async () => {
    if (!id) return;
    try {
      const res = await fetch(`${BASE_URL}/Donor/${id}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      setData(await res.json());
    } catch {
      /* keep existing */
    }
  };

  const donorModalInitial = useMemo((): DonorModalInitial | null => {
    if (!data?.supporter) return null;
    const s = data.supporter;
    let firstName = s.firstName ?? "";
    let lastName = s.lastName ?? "";
    if (!firstName.trim() && !lastName.trim()) {
      const dn = (s.displayName ?? "").trim();
      if (dn) {
        const parts = dn.split(/\s+/);
        firstName = parts[0] ?? "";
        lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
      }
    }
    return {
      supporterType: s.supporterType ?? "",
      firstName,
      lastName,
      relationshipType: s.relationshipType ?? "",
      region: s.region ?? "",
      email: s.email ?? "",
      phone: s.phone ?? "",
      status: s.status ?? "Active",
      acquisitionChannel: s.acquisitionChannel ?? "",
    };
  }, [data]);

  const dashboardData = useMemo(() => (data ? mapToDonorDashboard(data) : null), [data]);

  if (loading) {
    return (
      <div className="beacon-page beacon-page--loading text-center glass-nav-offset">
        <BeaconLoadingMark />
      </div>
    );
  }

  if (error || !data || !dashboardData) {
    return (
      <div className="beacon-page container py-4 glass-nav-offset">
        <div className="alert alert-danger">{error ?? "Donor not found."}</div>
      </div>
    );
  }

  const name = data.supporter.displayName
    ?? ([data.supporter.firstName, data.supporter.lastName].filter(Boolean).join(" ") || "Unknown");

  return (
    <>
      {isAdmin && donorModalInitial && id ? (
        <EditDonorModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={() => void reloadDonor()}
          supporterId={Number(id)}
          initialDonor={donorModalInitial}
        />
      ) : null}
      <DonorDashboardLayout
        mode={isAdmin ? "admin" : "donor"}
        data={dashboardData}
        headerSlot={
          isAdmin ? (
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <AdminDashboardBackLink />
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => setEditOpen(true)}
                >
                  Edit donor
                </button>
                <AdminDeleteRecordButton
                  entity="Donor"
                  id={id}
                  label="Delete donor record"
                  confirmMessage={`Delete donor "${name}" (ID ${id})? Donation rows linked to this supporter may be removed too. This cannot be undone.`}
                  redirectTo="/admin/all-donors"
                />
              </div>
            </div>
          ) : null
        }
      />
    </>
  );
}

export default DonorPage;
