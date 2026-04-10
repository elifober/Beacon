import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDonorDashboard } from "../api/Donors";
import type { DonorDashboard } from "../types/DonorDashboard";
import { DonorDashboardLayout } from "../components/donor/DonorDashboardLayout";
import BeaconLoadingMark from "../components/BeaconLoadingMark.tsx";

/**
 * Donor dashboard page.
 *
 * Architecture notes:
 * - The route includes `:id` for deep linking, but the backend enforces ownership:
 *   donors can only fetch their own dashboard; admins may fetch any donor by ID.
 * - This page delegates layout/visualization to `DonorDashboardLayout`.
 */
function DonorDashboardPage() {
  const { id } = useParams();
  const [data, setData] = useState<DonorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getDonorDashboard(Number(id))
      .then(setData)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="beacon-page beacon-page--loading text-center glass-nav-offset">
        <BeaconLoadingMark />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="beacon-page container py-4 glass-nav-offset">
        <div className="alert alert-danger">{error ?? "Donor not found."}</div>
      </div>
    );
  }

  return <DonorDashboardLayout mode="donor" data={data} />;
}

export default DonorDashboardPage;
