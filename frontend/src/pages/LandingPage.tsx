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
    <div>
      <section className="beacon-hero text-center py-5">
        <div className="container py-5" style={{ position: "relative", zIndex: 1 }}>
          <p className="text-uppercase fw-semibold mb-3" style={{ letterSpacing: "0.15em", fontSize: "0.85rem", color: "rgba(245,213,144,0.8)" }}>
            Beacon Sanctuary
          </p>
          <h1 className="display-3 fw-bold mb-3">A Light for Survivors</h1>
          <p className="lead fs-3 mb-4">
            Every Child Deserves Safety and Hope
          </p>
          <p className="mx-auto mb-5" style={{ maxWidth: 640, fontSize: "1.1rem" }}>
            Beacon provides safe homes and rehabilitation for girls who are survivors
            of sexual abuse and trafficking. Together, we can bring light to the
            darkest places.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link to="/login" className="btn btn-primary btn-lg px-4">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <div className="text-center mb-5">
          <h2 className="beacon-section-header display-6 mb-2">Every Donation Makes an Impact</h2>
          <p className="beacon-section-subtitle">
            See how funds are allocated across our program areas.
          </p>
        </div>

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
          <div className="alert alert-secondary text-center">No allocation data available.</div>
        )}

        {!loading && !error && (
          <div className="row g-4 justify-content-center">
            {breakdowns.map((b) => (
              <div key={b.programArea} className="col-sm-6 col-md-4 col-lg-3">
                <div className="card beacon-stat-card h-100 text-center p-4">
                  <div className="card-body d-flex flex-column justify-content-center">
                    <div className="beacon-stat-value mb-2">
                      {b.percentage}%
                    </div>
                    <h5 className="mb-0" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, color: "var(--beacon-navy)" }}>
                      {b.programArea}
                    </h5>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default LandingPage;
