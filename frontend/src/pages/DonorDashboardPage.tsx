import { useEffect, useRef, useState, type CSSProperties } from "react";
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
  const [showWelcome, setShowWelcome] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!id) return;
    getDonorDashboard(Number(id))
      .then(setData)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const pauseVideo = () => {
      if (!videoEl.paused) videoEl.pause();
    };

    const timeoutId = window.setTimeout(pauseVideo, 3800);
    videoEl.addEventListener("ended", pauseVideo);

    return () => {
      window.clearTimeout(timeoutId);
      videoEl.removeEventListener("ended", pauseVideo);
    };
  }, []);

  useEffect(() => {
    const hideTimer = window.setTimeout(() => setShowWelcome(false), 2600);
    return () => window.clearTimeout(hideTimer);
  }, []);

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
  const welcomeStyle = {
    "--welcome-chars": Math.max(fullName.length, 8),
  } as CSSProperties;

  return (
    <div className="beacon-page donor-dashboard-glass">
      <div className="donor-dashboard-glass__media" aria-hidden="true">
        <video
          ref={videoRef}
          className="donor-dashboard-glass__video"
          autoPlay
          muted
          playsInline
          preload="metadata"
        >
          <source src="/donor_dash_background.mp4" type="video/mp4" />
        </video>
        <div className="donor-dashboard-glass__overlay" />
      </div>

      <div className="container py-4 donor-dashboard-glass__content">
        <div
          className={`donor-dashboard-glass__welcome ${showWelcome ? "is-visible" : "is-hidden"}`}
          style={welcomeStyle}
          role="status"
          aria-live="polite"
        >
          <p className="donor-dashboard-glass__welcome-kicker mb-1">Welcome</p>
          <p className="donor-dashboard-glass__welcome-name mb-0">
            <span className="donor-dashboard-glass__welcome-name-text">{fullName}</span>
          </p>
        </div>
        <p className="landing-section__eyebrow mb-2">Supporter</p>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <h1 className="mb-0">Donor Dashboard</h1>
          <Link to="/donate" className="donor-dashboard-glass__donate-btn">
            Donate Now
          </Link>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-12 col-md-6 col-xl-3">
            <div className="donor-analytics-card">
              <p className="donor-analytics-card__label mb-1">Monetary total</p>
              <p className="donor-analytics-card__value mb-0">{formatCurrency(monetaryTotal)}</p>
            </div>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <div className="donor-analytics-card">
              <p className="donor-analytics-card__label mb-1">Non-monetary estimate</p>
              <p className="donor-analytics-card__value mb-0">{formatCurrency(nonMonetaryTotal)}</p>
            </div>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <div className="donor-analytics-card">
              <p className="donor-analytics-card__label mb-1">Most supported area</p>
              <p className="donor-analytics-card__value mb-0">
                {topProgramArea ? topProgramArea[0] : "N/A"}
              </p>
            </div>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <div className="donor-analytics-card">
              <p className="donor-analytics-card__label mb-1">Latest donation</p>
              <p className="donor-analytics-card__value mb-0">{latestDonationLabel}</p>
            </div>
          </div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-xl-5">
            <div className="donor-analytics-card donor-analytics-card--chart h-100">
              <h2 className="h5 mb-3">Donation mix</h2>
              <div className="donor-pie" style={chartStyle} role="img" aria-label="Donation mix chart" />
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
            <div className="donor-analytics-card h-100">
              <h2 className="h5 mb-3">Donation activity</h2>
              <div className="donor-mini-grid">
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

        <div className="row g-4 donor-dashboard-glass__layout">
          <div className="col-lg-5">
            <DonorInfo supporter={data.supporter} />
          </div>
          <div className="col-lg-7 d-flex flex-column gap-4">
            <MonetaryDonationHistory history={data.donationHistory} />
            <NonMonetaryDonationHistory history={data.donationHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DonorDashboardPage;
