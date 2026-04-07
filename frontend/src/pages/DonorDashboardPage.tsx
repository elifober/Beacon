import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDonorDashboard } from "../api/Donors";
import type { DonorDashboard } from "../types/DonorDashboard";
import DonorInfo from "../components/DonorInfo";
import DonorHistory from "../components/DonorHistory";

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
        <div className="alert alert-danger">
          {error ?? "Donor not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4">Donor Dashboard</h1>
      <div className="row g-4">
        <div className="col-lg-5">
          <DonorInfo supporter={data.supporter} />
        </div>
        <div className="col-lg-7">
          <DonorHistory history={data.donationHistory} />
        </div>
      </div>
    </div>
  );
}

export default DonorDashboardPage;
