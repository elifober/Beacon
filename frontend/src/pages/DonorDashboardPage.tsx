import { useEffect, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { getDonorDashboard } from "../api/Donors";
import type { DonorDashboard } from "../types/DonorDashboard";

function formatCurrency(value: number): string {
  return `PHP ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

type TrendPoint = { x: number; y: number };

/** Catmull–Rom style smooth curve through points (SVG cubic segments). */
function trendSmoothLinePath(points: TrendPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const d = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`);
  }
  return d.join(" ");
}

function trendAreaPath(points: TrendPoint[], floorY: number): string {
  if (points.length === 0) return "";
  const line = trendSmoothLinePath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x} ${floorY} L ${first.x} ${floorY} Z`;
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

  const allocationPalette = ["#6a9a8c", "#d28b63", "#55628e", "#bfa15a", "#8f74b6"];
  const programAllocations = Object.entries(
    data.donationHistory.reduce<Record<string, number>>((acc, item) => {
      const key = item.programArea?.trim() || "Unspecified";
      const numericValue = (item.amount ?? 0) + (item.estimatedValue ?? 0);
      // Fall back to count-based weighting when value fields are empty.
      const weight = numericValue > 0 ? numericValue : 1;
      acc[key] = (acc[key] ?? 0) + weight;
      return acc;
    }, {}),
  )
    .map(([program, value]) => ({ program, value }))
    .sort((a, b) => b.value - a.value);

  const totalAllocationWeight = programAllocations.reduce((sum, item) => sum + item.value, 0) || 1;
  const hasCurrencyAllocations = programAllocations.some((item) => item.value > 1);

  const allocationSlices = programAllocations.map((item, index) => ({
    ...item,
    color: allocationPalette[index % allocationPalette.length],
    share: (item.value / totalAllocationWeight) * 100,
  }));

  let runningPercent = 0;
  const gradientStops = allocationSlices
    .map((slice) => {
      const start = runningPercent;
      runningPercent += slice.share;
      return `${slice.color} ${start.toFixed(2)}% ${runningPercent.toFixed(2)}%`;
    })
    .join(", ");

  const allocationChartStyle = {
    "--donor-allocation-gradient": `conic-gradient(${gradientStops})`,
  } as CSSProperties;

  const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
    const now = new Date();
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;

    const value = data.donationHistory.reduce((sum, item) => {
      if (!item.donationDate) return sum;
      const donationDate = new Date(item.donationDate);
      if (Number.isNaN(donationDate.getTime())) return sum;
      const donationKey = `${donationDate.getFullYear()}-${String(donationDate.getMonth() + 1).padStart(2, "0")}`;
      if (donationKey !== monthKey) return sum;
      return sum + (item.amount ?? 0) + (item.estimatedValue ?? 0);
    }, 0);

    return {
      key: monthKey,
      label: monthDate.toLocaleDateString(undefined, { month: "short" }),
      value,
    };
  });

  const monthlyTrendMax = Math.max(...monthlyTrend.map((item) => item.value), 1);
  const trendFloorY = 93;
  const trendYTop = 12;
  const trendXPad = 5;
  const trendXRange = 100 - 2 * trendXPad;
  const trendCoords: TrendPoint[] = monthlyTrend.map((item, index) => {
    const x =
      monthlyTrend.length > 1
        ? trendXPad + (index / (monthlyTrend.length - 1)) * trendXRange
        : 50;
    const y =
      trendFloorY -
      (item.value / monthlyTrendMax) * (trendFloorY - trendYTop);
    return { x, y };
  });
  const trendAreaD = trendAreaPath(trendCoords, trendFloorY);
  const trendLineD = trendSmoothLinePath(trendCoords);

  const latestTrend = monthlyTrend[monthlyTrend.length - 1];

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
                <p className="donor-overview-profile-eyebrow mt-4 mb-2">Your profile</p>
                <dl className="donor-overview-meta mb-0">
                  {profileRows.map((row) => (
                    <div key={row.label} className="donor-overview-meta__row">
                      <dt className="donor-overview-meta__label">{row.label}</dt>
                      <dd className="donor-overview-meta__value">{row.value}</dd>
                    </div>
                  ))}
                </dl>
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
                <h2 className="landing-section__heading h4 mb-3">Donation allocations</h2>
                <div className="donor-allocation-chart">
                  <div
                    className="donor-allocation-chart__ring"
                    style={allocationChartStyle}
                    role="img"
                    aria-label="Donation allocation by program area"
                  >
                    <div className="donor-allocation-chart__center">
                      <p className="mb-0 donor-allocation-chart__center-kicker">Allocated</p>
                      <p className="mb-0 donor-allocation-chart__center-value">{formatCurrency(grandTotal)}</p>
                    </div>
                  </div>
                  <div className="donor-allocation-chart__legend mt-3">
                    {allocationSlices.map((slice) => (
                      <div key={slice.program} className="donor-allocation-chart__legend-row">
                        <p className="mb-0">
                          <span
                            className="donor-dot"
                            style={{ backgroundColor: slice.color }}
                            aria-hidden="true"
                          />{" "}
                          {slice.program}
                        </p>
                        <p className="mb-0 text-end">
                          {slice.share.toFixed(1)}% ·{" "}
                          {hasCurrencyAllocations
                            ? formatCurrency(slice.value)
                            : `${Math.round(slice.value)} donation(s)`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-7">
              <div className="admin-dashboard__panel donor-dashboard__glass-panel h-100">
                <h2 className="landing-section__heading h4 mb-3">Donation activity</h2>
                <div className="donor-trend mb-3" role="img" aria-label="Donation trend over the last six months">
                  <div className="donor-trend__chart">
                    <svg
                      className="donor-trend__svg"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="xMidYMid meet"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient
                          id="donor-trend-area-fill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#2d4f35" stopOpacity="0.2" />
                          <stop offset="45%" stopColor="#2d4f35" stopOpacity="0.07" />
                          <stop offset="100%" stopColor="#2d4f35" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {trendAreaD ? (
                        <path
                          className="donor-trend__area"
                          d={trendAreaD}
                          fill="url(#donor-trend-area-fill)"
                        />
                      ) : null}
                      {trendLineD ? (
                        <path
                          className="donor-trend__stroke"
                          d={trendLineD}
                          fill="none"
                        />
                      ) : null}
                      {trendCoords.map((p, i) => (
                        <circle
                          key={monthlyTrend[i]?.key ?? i}
                          className="donor-trend__dot"
                          cx={p.x}
                          cy={p.y}
                          r={1.65}
                        />
                      ))}
                    </svg>
                  </div>
                  <div className="donor-trend__labels">
                    {monthlyTrend.map((item) => (
                      <span key={item.key}>{item.label}</span>
                    ))}
                  </div>
                </div>
                <p className="donor-trend__meta mb-3">
                  {latestTrend.value > 0
                    ? `Latest month (${latestTrend.label}): ${formatCurrency(latestTrend.value)} in contributions`
                    : `No recorded contributions for ${latestTrend.label} yet`}
                </p>
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
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="admin-dashboard__nav-card donor-dashboard__glass-panel donor-events h-100">
                <h2 className="landing-section__heading h4 mb-3">Upcoming events</h2>
                <div className="donor-events__list">
                  {upcomingEvents.map((event) => (
                    <article key={event.title} className="donor-events__item">
                      <p className="donor-events__title mb-0">{event.title}</p>
                      <p className="donor-events__meta mb-0">{event.dateLabel}</p>
                      <p className="donor-events__detail mb-0">{event.detail}</p>
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
