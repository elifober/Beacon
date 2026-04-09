import { useEffect, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { getDonorDashboard } from "../api/Donors";
import type { DonorDashboard } from "../types/DonorDashboard";
import DonorInfo from "../components/DonorInfo";
import MonetaryDonationHistory from "../components/MonetaryDonationHistory";
import NonMonetaryDonationHistory from "../components/NonMonetaryDonationHistory";

function formatCurrency(value: number): string {
  return `PHP ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

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
        <div className="alert alert-danger">
          {error ?? "Donor not found."}
        </div>
      </div>
    );
  }

  const fullName =
    data.supporter.displayName
    ?? ([data.supporter.firstName, data.supporter.lastName].filter(Boolean).join(" ") || "Supporter");

  const monetaryDonations = data.donationHistory.filter(
    (item) => item.donationType?.toLowerCase() === "monetary",
  );
  const nonMonetaryDonations = data.donationHistory.filter(
    (item) => item.donationType?.toLowerCase() !== "monetary",
  );

  const monetaryTotal = monetaryDonations.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const nonMonetaryTotal = nonMonetaryDonations.reduce(
    (sum, item) => sum + (item.estimatedValue ?? 0),
    0,
  );
  const grandTotal = monetaryTotal + nonMonetaryTotal;
  const monetaryShare = grandTotal > 0 ? (monetaryTotal / grandTotal) * 100 : 50;
  const nonMonetaryShare = 100 - monetaryShare;

  const byProgramArea = data.donationHistory.reduce<Record<string, number>>((acc, item) => {
    const key = item.programArea?.trim() || "Unspecified";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const topProgramArea = Object.entries(byProgramArea).sort((a, b) => b[1] - a[1])[0];

  const latestDonationDate = data.donationHistory[0]?.donationDate;
  const latestDonationLabel = latestDonationDate
    ? new Date(latestDonationDate).toLocaleDateString()
    : "No donations yet";

  const chartStyle = {
    "--donor-monetary-share": `${monetaryShare.toFixed(2)}%`,
  } as CSSProperties;

  return (
    <div className="admin-dashboard beacon-page donor-dashboard">
      <header className="admin-dashboard__hero" aria-label="Donor dashboard header">
        <img
          className="admin-dashboard__hero-img"
          src="/houses.jpg"
          alt=""
          decoding="async"
        />
        <div className="admin-dashboard__hero-overlay" aria-hidden="true" />
        <div className="container admin-dashboard__hero-content">
          <p className="admin-dashboard__hero-eyebrow">Supporter dashboard</p>
          <h1 className="admin-dashboard__hero-title">Welcome, {fullName}</h1>
        </div>
      </header>

      <section className="admin-dashboard__main">
        <div className="container">
          <div className="row g-4 align-items-stretch mb-4">
            <div className="col-lg-8">
              <div className="admin-dashboard__panel h-100">
                <p className="landing-section__eyebrow mb-2">Overview</p>
                <h2 className="landing-section__heading mb-3">Your giving at a glance</h2>
                <p className="landing-section__body mb-0">
                  Track your monetary and non-monetary contributions, review your impact,
                  and continue supporting Beacon&apos;s mission.
                </p>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="admin-dashboard__nav-card">
                <p className="landing-section__eyebrow mb-3">Quick actions</p>
                <nav className="admin-dashboard__nav" aria-label="Donor quick actions">
                  <Link to="/donate" className="admin-dashboard__nav-link">
                    Donate now
                  </Link>
                  <a href="#donor-history" className="admin-dashboard__nav-link">
                    View donation history
                  </a>
                  <a href="#donor-analytics" className="admin-dashboard__nav-link">
                    View analytics
                  </a>
                </nav>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card beacon-stat-card h-100">
                <div className="card-body">
                  <p className="beacon-section-subtitle mb-2">Monetary total</p>
                  <p className="beacon-stat-value h3 mb-0">{formatCurrency(monetaryTotal)}</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card beacon-stat-card h-100">
                <div className="card-body">
                  <p className="beacon-section-subtitle mb-2">Non-monetary estimate</p>
                  <p className="beacon-stat-value h3 mb-0">{formatCurrency(nonMonetaryTotal)}</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card beacon-stat-card h-100">
                <div className="card-body">
                  <p className="beacon-section-subtitle mb-2">Most supported area</p>
                  <p className="beacon-stat-value h4 mb-0">
                    {topProgramArea ? topProgramArea[0] : "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card beacon-stat-card h-100">
                <div className="card-body">
                  <p className="beacon-section-subtitle mb-2">Latest donation</p>
                  <p className="beacon-stat-value h4 mb-0">{latestDonationLabel}</p>
                </div>
              </div>
            </div>
          </div>

          <div id="donor-analytics" className="row g-4 mb-4">
            <div className="col-xl-5">
              <div className="admin-dashboard__nav-card h-100">
                <h2 className="landing-section__heading h4 mb-3">Donation mix</h2>
                <div className="donor-pie donor-pie--clean" style={chartStyle} role="img" aria-label="Donation mix chart" />
                <div className="donor-pie__legend mt-3">
                  <p className="mb-1">
                    <span className="donor-dot donor-dot--monetary" /> Monetary:{" "}
                    {monetaryShare.toFixed(1)}%
                  </p>
                  <p className="mb-0">
                    <span className="donor-dot donor-dot--nonmonetary" /> Non-monetary:{" "}
                    {nonMonetaryShare.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            <div className="col-xl-7">
              <div className="admin-dashboard__panel h-100">
                <h2 className="landing-section__heading h4 mb-3">Donation activity</h2>
                <div className="donor-mini-grid donor-mini-grid--clean">
                  <div className="donor-mini-grid__item">
                    <p className="donor-mini-grid__label mb-1">Total donations</p>
                    <p className="donor-mini-grid__value mb-0">{data.donationHistory.length}</p>
                  </div>
                  <div className="donor-mini-grid__item">
                    <p className="donor-mini-grid__label mb-1">Monetary donations</p>
                    <p className="donor-mini-grid__value mb-0">{monetaryDonations.length}</p>
                  </div>
                  <div className="donor-mini-grid__item">
                    <p className="donor-mini-grid__label mb-1">Non-monetary donations</p>
                    <p className="donor-mini-grid__value mb-0">{nonMonetaryDonations.length}</p>
                  </div>
                  <div className="donor-mini-grid__item">
                    <p className="donor-mini-grid__label mb-1">Combined impact</p>
                    <p className="donor-mini-grid__value mb-0">{formatCurrency(grandTotal)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="donor-history" className="row g-4">
            <div className="col-lg-5">
              <DonorInfo supporter={data.supporter} />
            </div>
            <div className="col-lg-7 d-flex flex-column gap-4">
              <MonetaryDonationHistory history={data.donationHistory} />
              <NonMonetaryDonationHistory history={data.donationHistory} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DonorDashboardPage;
