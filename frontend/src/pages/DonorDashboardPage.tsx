import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDonorDashboard } from "../api/Donors";
import type { DonorDashboard } from "../types/DonorDashboard";

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
  const profileRows = [
    { label: "Name", value: fullName },
    { label: "Email", value: data.supporter.email ?? "N/A" },
    { label: "Status", value: data.supporter.status ?? "N/A" },
    { label: "Organization", value: data.supporter.organizationName ?? "N/A" },
  ] as const;

  const latestDonationDate = data.donationHistory[0]?.donationDate;
  const latestDonationLabel = latestDonationDate
    ? new Date(latestDonationDate).toLocaleDateString()
    : "No donations yet";

  const donutRadius = 42;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const monetaryArc = (monetaryShare / 100) * donutCircumference;
  const nonMonetaryArc = donutCircumference - monetaryArc;

  const upcomingEvents = [
    {
      title: "Community Build Day",
      dateLabel: "Sat · May 24, 2026",
      detail: "Family shelter upgrades",
    },
    {
      title: "Back-to-School Drive",
      dateLabel: "Thu · Jun 12, 2026",
      detail: "Supply packing and distribution",
    },
    {
      title: "Donor Appreciation Night",
      dateLabel: "Fri · Jul 03, 2026",
      detail: "Stories, updates, and impact highlights",
    },
  ] as const;

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
              <div className="admin-dashboard__panel donor-dashboard__glass-panel h-100">
                <p className="landing-section__eyebrow mb-2">Overview</p>
                <h2 className="landing-section__heading mb-3">Your giving at a glance</h2>
                <p className="landing-section__body mb-0">
                  Track your monetary and non-monetary contributions, review your impact,
                  and continue supporting Beacon&apos;s mission.
                </p>
                <div className="donor-overview-meta mt-4">
                  {profileRows.map((row) => (
                    <div key={row.label} className="donor-overview-meta__row">
                      <p className="donor-overview-meta__label mb-0">{row.label}</p>
                      <p className="donor-overview-meta__value mb-0">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="admin-dashboard__nav-card donor-dashboard__glass-panel donor-dashboard__glass-panel--nav">
                <p className="landing-section__eyebrow mb-3">Quick actions</p>
                <nav className="admin-dashboard__nav" aria-label="Donor quick actions">
                  <Link to="/donate" className="admin-dashboard__nav-link">
                    Donate now
                  </Link>
                  <a href="/#impact" className="admin-dashboard__nav-link">
                    View impact stories
                  </a>
                  <a href="#donor-analytics" className="admin-dashboard__nav-link">
                    View analytics
                  </a>
                  <a href="#donor-community" className="admin-dashboard__nav-link">
                    Community updates
                  </a>
                </nav>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card beacon-stat-card donor-dashboard__glass-panel h-100">
                <div className="card-body">
                  <p className="beacon-section-subtitle mb-2">Monetary total</p>
                  <p className="beacon-stat-value h3 mb-0">{formatCurrency(monetaryTotal)}</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card beacon-stat-card donor-dashboard__glass-panel h-100">
                <div className="card-body">
                  <p className="beacon-section-subtitle mb-2">Non-monetary estimate</p>
                  <p className="beacon-stat-value h3 mb-0">{formatCurrency(nonMonetaryTotal)}</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card beacon-stat-card donor-dashboard__glass-panel h-100">
                <div className="card-body">
                  <p className="beacon-section-subtitle mb-2">Most supported area</p>
                  <p className="beacon-stat-value h4 mb-0">
                    {topProgramArea ? topProgramArea[0] : "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card beacon-stat-card donor-dashboard__glass-panel h-100">
                <div className="card-body">
                  <p className="beacon-section-subtitle mb-2">Latest donation</p>
                  <p className="beacon-stat-value h4 mb-0">{latestDonationLabel}</p>
                </div>
              </div>
            </div>
          </div>

          <div id="donor-analytics" className="row g-4 mb-4">
            <div className="col-xl-5">
              <div className="admin-dashboard__nav-card donor-dashboard__glass-panel h-100">
                <h2 className="landing-section__heading h4 mb-3">Donation mix</h2>
                <div className="donor-mix-chart" role="img" aria-label="Donation mix chart">
                  <svg viewBox="0 0 120 120" className="donor-mix-chart__svg" aria-hidden="true">
                    <circle className="donor-mix-chart__track" cx="60" cy="60" r={donutRadius} />
                    <circle
                      className="donor-mix-chart__slice donor-mix-chart__slice--monetary"
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      strokeDasharray={`${monetaryArc} ${donutCircumference - monetaryArc}`}
                      strokeDashoffset="0"
                    />
                    <circle
                      className="donor-mix-chart__slice donor-mix-chart__slice--nonmonetary"
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      strokeDasharray={`${nonMonetaryArc} ${donutCircumference - nonMonetaryArc}`}
                      strokeDashoffset={-monetaryArc}
                    />
                  </svg>
                  <div className="donor-mix-chart__center">
                    <p className="mb-0 donor-mix-chart__center-kicker">Total impact</p>
                    <p className="mb-0 donor-mix-chart__center-value">{formatCurrency(grandTotal)}</p>
                  </div>
                  <div className="donor-mix-chart__callout donor-mix-chart__callout--left">
                    <p className="mb-0 fw-semibold">Monetary ({monetaryDonations.length})</p>
                    <p className="mb-0">{monetaryShare.toFixed(1)}%</p>
                  </div>
                  <div className="donor-mix-chart__callout donor-mix-chart__callout--right">
                    <p className="mb-0 fw-semibold">Non-monetary ({nonMonetaryDonations.length})</p>
                    <p className="mb-0">{nonMonetaryShare.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-7">
              <div className="admin-dashboard__panel donor-dashboard__glass-panel h-100">
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

          <div id="donor-community" className="row g-4 mt-1">
            <div className="col-lg-5">
              <div className="admin-dashboard__panel donor-dashboard__glass-panel h-100">
                <p className="landing-section__eyebrow mb-2">Community</p>
                <h2 className="landing-section__heading h4 mb-3">Stay close to the impact</h2>
                <p className="landing-section__body mb-0">
                  Join upcoming Beacon events, meet other supporters, and see how your
                  contributions directly power safe shelter, health, and rehabilitation.
                </p>
                <div className="donor-community-actions mt-4">
                  <a href="/#impact" className="donor-community-actions__btn">
                    Explore impact
                  </a>
                  <a
                    href="mailto:info@beaconsanctuary.org?subject=Beacon%20Email%20Updates"
                    className="donor-community-actions__btn donor-community-actions__btn--accent"
                  >
                    Join email updates
                  </a>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="admin-dashboard__nav-card donor-dashboard__glass-panel donor-events h-100">
                <h2 className="landing-section__heading h4 mb-3">Upcoming events</h2>
                <div className="donor-events__list">
                  {upcomingEvents.map((event) => (
                    <article key={event.title} className="donor-events__item">
                      <div>
                        <p className="donor-events__title mb-0">{event.title}</p>
                        <p className="donor-events__meta mb-0">{event.dateLabel}</p>
                        <p className="donor-events__detail mb-0">{event.detail}</p>
                      </div>
                      <button type="button" className="donor-events__cta">
                        Save my spot
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DonorDashboardPage;
