import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchImpactPublicStats, type ImpactPublicStats } from "../api/impactStats";
import Footer from "../components/Footer";
import { useCountUp } from "../hooks/useCountUp";

const impactPosts = [
  {
    title: "Highs and Lows at Beacon",
    date: "May 11, 2025",
    image: "/highsandlows.jpg",
    summary:
      "A candid reflection on the emotional highs and lows in one day at the shelter, and why continued donor support keeps hope alive for every child.",
  },
  {
    title: "The Power of Light",
    date: "December 11, 2024",
    image: "/cops.jpg",
    summary:
      "A perspective on healing through light, mercy, accountability, and hope—showing that justice and compassion can work together.",
  },
  {
    title: "Thankful to Celebrate 5 Years",
    date: "September 12, 2023",
    image: "/group_with_baby.jpeg",
    summary:
      "Celebrating five years of shelter operations, over 100 children served, and expansion into a second location.",
  },
] as const;

const impactStatsFallback: { label: string; value: string }[] = [
  { label: "Children served", value: "100+" },
  { label: "Residential shelters", value: "2" },
  { label: "Current residents in care", value: "15" },
  { label: "Years of operation", value: "5+" },
];

/** Split "100+" / "95%" / "1,234" for clearer typographic hierarchy */
function splitImpactStatValue(value: string): { main: string; suffix: string } {
  const t = value.trim();
  if (!t || t === "…" || t === "—") return { main: t, suffix: "" };
  const m = t.match(/^([\d,]+)([^\d]*)$/u);
  if (m) return { main: m[1], suffix: m[2] };
  return { main: t, suffix: "" };
}

function ImpactStatValueStatic({ value }: { value: string }) {
  const { main, suffix } = splitImpactStatValue(value);
  return (
    <p className="impact-page__stat-value mb-1">
      <span className="impact-page__stat-value-inner">
        <span className="impact-page__stat-value-num">{main}</span>
        {suffix ? <span className="impact-page__stat-value-suffix">{suffix}</span> : null}
      </span>
    </p>
  );
}

/** Same count-up + intersection pattern as landing `AnimatedStat`. */
function ImpactAnimatedStatValue({ value }: { value: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [visible, setVisible] = useState(false);
  const onIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0]?.isIntersecting) setVisible(true);
  }, []);

  const t = value.trim();
  const { main, suffix } = splitImpactStatValue(value);
  const numericTarget = parseInt(main.replace(/\D/g, ""), 10);
  const isStatic =
    t === "…" || t === "—" || !Number.isFinite(numericTarget);
  const safeTarget = Number.isFinite(numericTarget) ? numericTarget : 0;

  useEffect(() => {
    if (isStatic) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(onIntersect, { threshold: 0.35 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [isStatic, onIntersect]);

  const displayed = useCountUp(safeTarget, 2000, !isStatic && visible);

  if (isStatic) {
    return <ImpactStatValueStatic value={value} />;
  }

  const displayMain = main.includes(",") ? displayed.toLocaleString() : String(displayed);

  return (
    <p ref={ref} className="impact-page__stat-value mb-1">
      <span className="impact-page__stat-value-inner">
        <span className="impact-page__stat-value-num">{displayMain}</span>
        {suffix ? <span className="impact-page__stat-value-suffix">{suffix}</span> : null}
      </span>
    </p>
  );
}

function formatImpactStatRows(data: ImpactPublicStats | null): { label: string; value: string }[] {
  if (!data) return impactStatsFallback;
  const served = data.totalResidentsServed.toLocaleString();
  const shelters = String(data.residentialShelters);
  const current = String(data.currentResidents);
  const years = data.yearsOfOperation > 0 ? `${data.yearsOfOperation}+` : "—";
  return [
    { label: "Children served", value: served },
    { label: "Residential shelters", value: shelters },
    { label: "Current residents in care", value: current },
    { label: "Years of operation", value: years },
  ];
}

function ImpactPage() {
  const [stats, setStats] = useState<ImpactPublicStats | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchImpactPublicStats().then((s) => {
      if (!cancelled) setStats(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const impactStatRows = useMemo(() => {
    if (stats === undefined) {
      return impactStatsFallback.map((s) => ({ ...s, value: "…" }));
    }
    return formatImpactStatRows(stats);
  }, [stats]);

  return (
    <div className="impact-page beacon-page">
      <header className="impact-page__hero">
        <div className="impact-page__hero-overlay" aria-hidden="true" />
        <div className="container impact-page__hero-inner">
          <p className="landing-section__eyebrow landing-section__eyebrow--light mb-2">
            Beacon impact
          </p>
          <h1 className="impact-page__title mb-3">Stories of healing, justice, and hope</h1>
          <p className="impact-page__lead mb-0">
            A look at milestones and reflections from the Beacon blog,
            reimagined in Beacon&apos;s updated visual style.
          </p>
        </div>
      </header>

      <section className="impact-page__content">
        <div className="container">
          <div className="row g-3 mb-4 align-items-stretch impact-page__stats-row">
            {impactStatRows.map((stat) => (
              <div className="col-6 col-lg-3 d-flex" key={stat.label}>
                <div className="impact-page__stat">
                  <ImpactAnimatedStatValue value={stat.value} />
                  <p className="impact-page__stat-label mb-0">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-4">
            {impactPosts.map((post) => (
              <div className="col-lg-4" key={post.title}>
                <article className="impact-page__story-card">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="impact-page__story-img"
                    loading="lazy"
                    decoding="async"
                  />
                  <p className="impact-page__story-date mb-2">{post.date}</p>
                  <h2 className="h5 mb-2">{post.title}</h2>
                  <p className="mb-0">{post.summary}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default ImpactPage;
