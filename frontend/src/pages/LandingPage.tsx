import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { getAllocations } from "../api/Allocations";
import type { AllocationRow, ProgramBreakdown } from "../types/ProgramAllocation";

/* ── helpers ── */

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

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  const hasRun = useRef(false);
  useEffect(() => {
    if (!start || hasRun.current) return;
    hasRun.current = true;
    const t0 = performance.now();
    let raf: number;
    const step = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return count;
}

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
  const suffix = value.replace(/[0-9]/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const cb = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting) setVisible(true);
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(cb, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [cb]);
  const displayed = useCountUp(num, 2000, visible);
  return (
    <div className="impact-stat" ref={ref}>
      <span className="impact-stat__value">{displayed}{suffix}</span>
      <span className="impact-stat__label">{label}</span>
    </div>
  );
}

/* ── static data ── */

const pillars = [
  {
    num: "01",
    icon: "bi-shield-check",
    title: "Safety",
    body: "Safety is the first step of healing. We provide secure, loving homes where every child can begin to feel protected and cared for.",
  },
  {
    num: "02",
    icon: "bi-heart-pulse",
    title: "Healing",
    body: "Once a child trusts that they are safe, the healing process begins — through counseling, education, and nurturing relationships.",
  },
  {
    num: "03",
    icon: "bi-balance-scale",
    title: "Justice",
    body: "We support children in pursuing what justice means for them, walking alongside them every step of the way through the legal process.",
  },
  {
    num: "04",
    icon: "bi-rocket-takeoff",
    title: "Empowerment",
    body: "Our goal is to help children move from victimhood into leadership and advocacy — building confidence and independence for their future.",
  },
];

const impactStats = [
  { value: "200+", label: "Girls Rescued" },
  { value: "12", label: "Safe Homes" },
  { value: "95%", label: "Recovery Rate" },
  { value: "30+", label: "Community Partners" },
];

const programs = [
  { icon: "bi-house-heart", title: "Physiological Needs", desc: "Safe shelter, nutrition, clothing, and daily essentials for every child." },
  { icon: "bi-clipboard2-pulse", title: "Biological Needs", desc: "Medical care, health screenings, and ongoing wellness support." },
  { icon: "bi-brightness-high", title: "Spiritual Needs", desc: "Nurturing faith, hope, and purpose through community and reflection." },
  { icon: "bi-brain", title: "Psychological Needs", desc: "Trauma-informed counseling, therapy, and mental health support." },
  { icon: "bi-people", title: "Social Needs", desc: "Building healthy relationships, social skills, and community connections." },
  { icon: "bi-emoji-smile", title: "Love & Belonging", desc: "Creating a family environment where every child is seen, heard, and loved." },
];

const waysToHelp = [
  {
    icon: "bi-heart-fill",
    title: "Donate",
    description: "Your financial gift directly funds safe housing, counseling, and education for survivors.",
    cta: "Give Now",
    link: "/login",
  },
  {
    icon: "bi-people-fill",
    title: "Partner With Us",
    description: "Organizations and churches can partner with Beacon to expand our reach and impact.",
    cta: "Become a Partner",
    link: "/register",
  },
  {
    icon: "bi-hand-thumbs-up-fill",
    title: "Volunteer",
    description: "Share your time and skills to mentor, teach, and support girls on their journey to healing.",
    cta: "Get Involved",
    link: "/register",
  },
  {
    icon: "bi-megaphone-fill",
    title: "Spread the Word",
    description: "Raise awareness in your community. Every voice matters in the fight against trafficking.",
    cta: "Learn More",
    link: "/login",
  },
];

const stories = [
  {
    date: "May 2025",
    title: "Highs and Lows of Beacon",
    excerpt: "As I re-entered its doors this month, I was reminded why it's so hard to put into words what it's like to be part of this place...",
  },
  {
    date: "December 2024",
    title: "The Power of Light",
    excerpt: "A potential donor called, eager to help the survivors, and she declared boldly how she could help. Her response inspired this reflection...",
  },
  {
    date: "September 2023",
    title: "Thankful to Celebrate 5 Years",
    excerpt: "It's been 5 years since we opened our doors. I remember receiving our license and thinking — I hope we can manage the flood of children who will be referred...",
  },
];

/* ── component ── */

function LandingPage() {
  const [breakdowns, setBreakdowns] = useState<ProgramBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    getAllocations()
      .then((data) => setBreakdowns(computePercentages(data)))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onScroll = () => setShowButtons(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing">
      {/* 1 ─── ANNOUNCEMENT BAR ─── */}
      <div className="announcement-bar">
        <div className="announcement-bar__inner">
          <span className="announcement-bar__badge">DONATE</span>
          <span className="announcement-bar__text">
            100% of every gift goes directly to safe homes and healing for survivors of trafficking.
          </span>
          <Link to="/login" className="announcement-bar__link">
            Give hope today <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>

      {/* 3 ─── HERO ─── */}
      <section className="hero">
        <div className="hero__video-wrap">
          <video
            className="hero__video"
            src="/hero-video.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="hero__overlay" />
        </div>
        <div className="hero__content">
          <h1 className="hero__title">
            Support<br />
            survivors and<br />
            give hope a chance
          </h1>
          <div className={`hero__actions ${showButtons ? "hero__actions--visible" : ""}`}>
            <Link to="/login" className="hero__btn hero__btn--primary">
              Donate Now
            </Link>
            <a href="#mission" className="hero__btn hero__btn--outline">
              Our Mission
            </a>
          </div>
        </div>
      </section>

      {/* 4 ─── INTRO TAGLINE ─── */}
      <section className="intro-tagline">
        <div className="container">
          <h2 className="intro-tagline__heading">
            Join us in our mission to bring safety, healing, justice, and
            empowerment to survivors.
          </h2>
          <a href="#mission" className="intro-tagline__link">
            Our story <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </section>

      {/* 5 ─── WHAT WE DO — 4 PILLARS ─── */}
      <section id="mission" className="landing-section landing-section--light">
        <div className="container">
          <div className="text-center mb-5">
            <p className="landing-section__eyebrow">What We Do</p>
            <h2 className="landing-section__heading">
              Provide Safety. Healing. And&nbsp;Empowerment.
            </h2>
          </div>
          <div className="row g-4">
            {pillars.map((p) => (
              <div key={p.title} className="col-sm-6 col-lg-3">
                <div className="pillar-card">
                  <span className="pillar-card__num">{p.num}</span>
                  <div className="pillar-card__icon">
                    <i className={`bi ${p.icon}`} />
                  </div>
                  <h5 className="pillar-card__title">{p.title}</h5>
                  <p className="pillar-card__body">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 ─── QUOTE / TESTIMONIAL ─── */}
      <section className="quote-section">
        <div className="container">
          <blockquote className="quote-section__quote">
            &ldquo;Beacon is a safe place, where we are treated as family.&rdquo;
          </blockquote>
          <p className="quote-section__caption">— Beacon Sanctuary Motto</p>
          <p className="quote-section__sub">
            We are Beacon: full of hope, love, and new beginnings. Our focus is
            progress in all aspects of life. We treat each other as family where
            each individual is seen, heard, and loved.
          </p>
        </div>
      </section>

      {/* 7 ─── IMPACT STATS ─── */}
      <section id="impact" className="landing-section landing-section--dark">
        <div className="container text-center">
          <p className="landing-section__eyebrow landing-section__eyebrow--light">
            Our Impact
          </p>
          <h2 className="landing-section__heading landing-section__heading--light">
            Making a measurable difference
          </h2>
          <div className="row g-4 mt-3 justify-content-center">
            {impactStats.map((s) => (
              <div key={s.label} className="col-6 col-md-3">
                <AnimatedStat value={s.value} label={s.label} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 ─── FEATURED CAMPAIGN ─── */}
      <section className="landing-section landing-section--light">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <p className="landing-section__eyebrow">Featured Campaign</p>
              <h2 className="landing-section__heading">
                Wheels of Hope:<br />A Van That Changes Lives
              </h2>
              <p className="landing-section__body">
                Every mile matters when a girl's safety and future are on the
                line. Our <strong>Wheels of Hope</strong> campaign supports the
                purchase of a new van that delivers security, dignity, and
                connection.
              </p>
              <p className="landing-section__body">
                The vans bring girls to safety, shuttle them to court hearings
                to seek justice, and take them to community activities that help
                them build trust with safe, caring people.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ borderRadius: 50 }}>
                Support This Campaign
              </Link>
            </div>
            <div className="col-lg-6">
              <div className="campaign-placeholder">
                <i className="bi bi-truck" />
                <span>Wheels of Hope</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9 ─── OUR PROGRAMS ─── */}
      <section className="landing-section landing-section--accent">
        <div className="container">
          <div className="text-center mb-5">
            <p className="landing-section__eyebrow">Our Programs &amp; Services</p>
            <h2 className="landing-section__heading">
              Meeting every need of every child
            </h2>
          </div>
          <div className="row g-4 justify-content-center">
            {programs.map((p) => (
              <div key={p.title} className="col-sm-6 col-md-4">
                <div className="program-card">
                  <div className="program-card__icon">
                    <i className={`bi ${p.icon}`} />
                  </div>
                  <h5 className="program-card__title">{p.title}</h5>
                  <p className="program-card__desc">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10 ─── ALLOCATION BREAKDOWN ─── */}
      <section className="landing-section landing-section--light">
        <div className="container">
          <div className="text-center mb-5">
            <p className="landing-section__eyebrow">Transparency</p>
            <h2 className="landing-section__heading">
              Every Donation Makes an Impact
            </h2>
            <p className="landing-section__sub">
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
          {error && <div className="alert alert-danger">Failed to load data: {error}</div>}
          {!loading && !error && breakdowns.length === 0 && (
            <div className="alert alert-secondary text-center">No allocation data available yet.</div>
          )}
          {!loading && !error && breakdowns.length > 0 && (
            <div className="row g-4 justify-content-center">
              {breakdowns.map((b) => (
                <div key={b.programArea} className="col-sm-6 col-md-4 col-lg-3">
                  <div className="card allocation-card h-100 text-center p-4">
                    <div className="card-body d-flex flex-column justify-content-center">
                      <div className="allocation-card__value">{b.percentage}%</div>
                      <h5 className="allocation-card__label">{b.programArea}</h5>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 11 ─── GET INVOLVED ─── */}
      <section id="involved" className="landing-section landing-section--dark">
        <div className="container">
          <div className="text-center mb-5">
            <p className="landing-section__eyebrow landing-section__eyebrow--light">
              Get Involved
            </p>
            <h2 className="landing-section__heading landing-section__heading--light">
              Improve lives&nbsp;with&nbsp;us
            </h2>
            <p className="landing-section__sub" style={{ color: "var(--beacon-text-muted)" }}>
              There are many ways to make a difference. Choose yours.
            </p>
          </div>
          <div className="row g-4">
            {waysToHelp.map((w) => (
              <div key={w.title} className="col-sm-6 col-lg-3">
                <div className="card involve-card h-100 text-center p-4">
                  <div className="card-body d-flex flex-column">
                    <div className="involve-card__icon">
                      <i className={`bi ${w.icon}`} />
                    </div>
                    <h5 className="involve-card__title">{w.title}</h5>
                    <p className="involve-card__desc">{w.description}</p>
                    <Link to={w.link} className="btn btn-outline-primary mt-auto">
                      {w.cta}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12 ─── LATEST STORIES ─── */}
      <section className="landing-section landing-section--light">
        <div className="container">
          <div className="text-center mb-5">
            <p className="landing-section__eyebrow">Latest Stories</p>
            <h2 className="landing-section__heading">
              News &amp; updates from Beacon
            </h2>
          </div>
          <div className="row g-4">
            {stories.map((s) => (
              <div key={s.title} className="col-md-4">
                <div className="story-card">
                  <div className="story-card__image">
                    <i className="bi bi-journal-text" />
                  </div>
                  <div className="story-card__body">
                    <span className="story-card__date">{s.date}</span>
                    <h5 className="story-card__title">{s.title}</h5>
                    <p className="story-card__excerpt">{s.excerpt}</p>
                    <span className="story-card__read">Read More &rarr;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 13 ─── CTA BANNER ─── */}
      <section className="landing-cta">
        <div className="container text-center">
          <h2 className="landing-cta__heading">
            Bring safety, healing, and empowerment to children in need
          </h2>
          <p className="landing-cta__sub">
            Join the growing community of donors, partners, and volunteers
            building a safer world for survivors.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link to="/register" className="btn btn-primary btn-lg px-5" style={{ borderRadius: 50 }}>
              Join Beacon
            </Link>
            <Link to="/login" className="btn btn-outline-light btn-lg px-5" style={{ borderRadius: 50 }}>
              Donate Now
            </Link>
          </div>
        </div>
      </section>

      {/* 14 ─── FOOTER ─── */}
      <footer className="landing-footer">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <img src="/logo.png" alt="Beacon" className="landing-footer__logo" />
              <p className="landing-footer__text">
                We treat each other as family where each individual is seen,
                heard, and loved. We create fun memories, we fight for justice,
                and we acknowledge God in all we do.
              </p>
            </div>
            <div className="col-md-2">
              <h6 className="landing-footer__heading">About</h6>
              <ul className="landing-footer__list">
                <li><a href="#mission">Our Mission</a></li>
                <li><Link to="/login">Our Team</Link></li>
              </ul>
            </div>
            <div className="col-md-2">
              <h6 className="landing-footer__heading">Get Involved</h6>
              <ul className="landing-footer__list">
                <li><Link to="/login">Donate</Link></li>
                <li><Link to="/register">Partner</Link></li>
                <li><Link to="/register">Volunteer</Link></li>
              </ul>
            </div>
            <div className="col-md-4">
              <h6 className="landing-footer__heading">Contact</h6>
              <p className="landing-footer__text">
                Have questions? Reach out to us at&nbsp;
                <a href="mailto:info@beaconsanctuary.org">info@beaconsanctuary.org</a>
              </p>
            </div>
          </div>
          <hr className="landing-footer__rule" />
          <p className="landing-footer__copy">
            &copy; {new Date().getFullYear()} Beacon Sanctuary. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
