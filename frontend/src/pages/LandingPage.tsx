import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllocations } from "../api/Allocations";
import type { AllocationRow, ProgramBreakdown } from "../types/ProgramAllocation";

function computePercentages(allocations: AllocationRow[]): ProgramBreakdown[] {
  const totals = new Map<string, number>();

  for (const a of allocations) {
    const current = totals.get(a.programArea) ?? 0;
    totals.set(a.programArea, current + (a.amountAllocated ?? 0));
  }

  const grandTotal = [...totals.values()].reduce((sum, v) => sum + v, 0);

  return [...totals.entries()]
    .map(([programArea, total]) => ({
      programArea,
      percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

function LandingPage() {
  const [breakdowns, setBreakdowns] = useState<ProgramBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllocations()
      .then((data) => setBreakdowns(computePercentages(data)))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold">Beacon</h1>
        <p className="lead text-muted">
          See where donations are making an impact.
        </p>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-8">
          <h2 className="h5 mb-3">Fund Allocation by Program Area</h2>

          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger">Failed to load data: {error}</div>
          )}

          {!loading && !error && breakdowns.length === 0 && (
            <div className="alert alert-secondary">No allocation data available.</div>
          )}

          {!loading && !error && breakdowns.map((b) => (
            <div key={b.programArea} className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <span className="fw-semibold">{b.programArea} </span>
                <span>{b.percentage}%</span>
              </div>
              <div className="progress" style={{ height: "1.25rem" }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${b.percentage}%` }}
                  aria-valuenow={b.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-5">
        <Link to="/login" className="btn btn-primary btn-lg">
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default LandingPage;
