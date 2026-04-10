import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import { SiteAnnouncementBar } from "../components/SiteAnnouncementBar";
import { useCountUp } from "../hooks/useCountUp";

/* ── helpers ── */

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
      <span className="impact-stat__value">
        <span className="impact-stat__value-num">{displayed}</span>
        {suffix ? (
          <span className="impact-stat__value-suffix">{suffix}</span>
        ) : null}
      </span>
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
    icon: "bi-journal-text",
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

/** Shown if the API returns no allocation rows (empty DB, error, or offline). */
const fallbackImpactStats = [
  { value: "200+", label: "Girls Rescued" },
  { value: "12", label: "Safe Homes" },
  { value: "95%", label: "Recovery Rate" },
  { value: "30+", label: "Community Partners" },
] as const;

const programs: { title: string; desc: string; image: string; points: string[] }[] = [
  {
    title: "Daily Essentials",
    desc: "Safe shelter and practical care that restores stability from day one.",
    image: "/moms.jpg",
    points: ["Safe housing", "Nutritious meals", "Clothing and daily supplies"],
  },
  {
    title: "Health & Healing",
    desc: "Whole-child healing through physical care and emotional recovery support.",
    image: "/doctor.jpg",
    points: ["Medical checkups", "Trauma-informed counseling", "Healthy routines and play"],
  },
  {
    title: "Family & Belonging",
    desc: "A loving community where girls rebuild trust, confidence, and hope.",
    image: "/FingerStar.jpg",
    points: ["Mentorship and guidance", "Relationship-building", "Faith, purpose, and belonging"],
  },
];

const waysToHelp = [
  {
    title: "Donate",
    description: "Your financial gift directly funds safe housing, counseling, and education for survivors.",
    cta: "Give Now",
    link: "/donate",
    image: "/donate.jpg",
  },
  {
    title: "Partner With Us",
    description: "Organizations and churches can partner with Beacon to expand our reach and impact.",
    cta: "Become a Partner",
    link: "/register",
    image: "/Hands_Circle.jpg",
  },
  {
    title: "Volunteer",
    description: "Share your time and skills to mentor, teach, and support girls on their journey to healing.",
    cta: "Get Involved",
    link: "/register",
    image: "/yoga.jpg",
  },
  {
    title: "Spread the Word",
    description: "Raise awareness in your community. Every voice matters in the fight against trafficking.",
    cta: "Learn More",
    link: "/register",
    image: "/PinkShirtPinkFlower.jpg",
  },
];

const upcomingEvents = [
  {
    dayName: "Sat",
    day: "18",
    monthYear: "Jul 2026",
    title: "Beacon Hope Run",
    dates: "July 18, 2026",
    price: "Fundraiser Event",
  },
  {
    dayName: "Thu",
    day: "06",
    monthYear: "Aug 2026",
    title: "Community Awareness Night",
    dates: "August 6, 2026",
    price: "Free Registration",
  },
  {
    dayName: "Tue",
    day: "22",
    monthYear: "Sep 2026",
    title: "Partner & Volunteer Orientation",
    dates: "September 22, 2026",
    price: "On-site + Online",
  },
] as const;

/** Hero donate card preset amounts (PHP), Radiating Hope–style grid */
const HERO_DONATE_PRESETS = [500, 250, 150, 50, 25, 10] as const;

function HeroDonateCard() {
  const [monthly, setMonthly] = useState(false);
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [otherAmount, setOtherAmount] = useState("");
  const [addNote, setAddNote] = useState(false);
  const [note, setNote] = useState("");

  const donateContinueHref = useMemo(() => {
    const params = new URLSearchParams();
    const fromOther = otherAmount.replace(/[^0-9.]/g, "");
    const amount =
      activePreset != null
        ? String(activePreset)
        : fromOther.trim() !== ""
          ? fromOther
          : "";
    if (amount) params.set("amount", amount);
    if (monthly) params.set("monthly", "1");
    if (addNote && note.trim()) params.set("note", note.trim());
    const q = params.toString();
    return q ? `/donate?${q}` : "/donate";
  }, [activePreset, otherAmount, monthly, addNote, note]);

  const selectPreset = (n: number) => {
    setActivePreset(n);
    setOtherAmount("");
  };

  const onOtherChange = (v: string) => {
    setOtherAmount(v.replace(/[^0-9.]/g, ""));
    setActivePreset(null);
  };

  return (
    <div className="hero-donate-card">
      <p className="hero-donate-card__lead">
        Choose an amount in Philippine pesos—your gift goes directly to safe homes,
        counseling, and education for survivors.
      </p>

      <div className="hero-donate-card__section-head">
        <i className="bi bi-check-circle-fill hero-donate-card__check" aria-hidden="true" />
        <span>Choose amount</span>
      </div>

      <div className="hero-donate-card__frequency" role="group" aria-label="Donation frequency">
        <button
          type="button"
          className={`hero-donate-card__freq ${!monthly ? "hero-donate-card__freq--active" : ""}`}
          onClick={() => setMonthly(false)}
        >
          One-time
        </button>
        <button
          type="button"
          className={`hero-donate-card__freq ${monthly ? "hero-donate-card__freq--active" : ""}`}
          onClick={() => setMonthly(true)}
        >
          Monthly
        </button>
      </div>

      <div className="hero-donate-card__grid" role="group" aria-label="Suggested amounts in Philippine pesos">
        {HERO_DONATE_PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            className={`hero-donate-card__amt ${activePreset === n ? "hero-donate-card__amt--active" : ""}`}
            onClick={() => selectPreset(n)}
          >
            ₱{n.toLocaleString()}
          </button>
        ))}
      </div>

      <label className="hero-donate-card__other" htmlFor="hero-donate-other">
        <span className="hero-donate-card__other-prefix" aria-hidden="true">₱</span>
        <input
          id="hero-donate-other"
          type="text"
          inputMode="decimal"
          className="hero-donate-card__other-input"
          placeholder="Other"
          autoComplete="off"
          value={otherAmount}
          onChange={(e) => onOtherChange(e.target.value)}
        />
        <span className="hero-donate-card__other-suffix">PHP</span>
      </label>

      <label className="hero-donate-card__note-toggle">
        <input
          type="checkbox"
          checked={addNote}
          onChange={(e) => setAddNote(e.target.checked)}
        />
        <span>Add note / comment</span>
      </label>
      {addNote && (
        <textarea
          className="hero-donate-card__note-area form-control"
          rows={3}
          placeholder="Optional message with your gift"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      )}

      <Link to={donateContinueHref} className="hero-donate-card__cta">
        Donate now
      </Link>
    </div>
  );
}

const stories = [
  {
    date: "May 2025",
    title: "Highs and Lows of Beacon",
    image: "/highsandlows.jpg",
    excerpt: "As I re-entered its doors this month, I was reminded why it's so hard to put into words what it's like to be part of this place...",
  },
  {
    date: "December 2024",
    title: "The Power of Light",
    image: "/threegirls.jpg",
    excerpt: "A potential donor called, eager to help the survivors, and she declared boldly how she could help. Her response inspired this reflection...",
  },
  {
    date: "September 2023",
    title: "Thankful to Celebrate 5 Years",
    image: "/groupcircle.jpeg",
    excerpt: "It's been 5 years since we opened our doors. I remember receiving our license and thinking — I hope we can manage the flood of children who will be referred...",
  },
];

/* ── component ── */

function LandingPage() {
  const location = useLocation();
  const [showHeroButtons, setShowHeroButtons] = useState(false);
  const impactStats = useMemo(
    () =>
    fallbackImpactStats.map((s) => ({
      value: s.value,
      label: s.label,
      key: s.label,
    })),
    [],
  );

  useEffect(() => {
    const raw = location.hash?.replace(/^#/, "");
    if (!raw) return;
    const el = document.getElementById(raw);
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(t);
  }, [location.hash, location.pathname]);

  useEffect(() => {
    const onScroll = () => setShowHeroButtons(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing">
      {/* 1 ─── ANNOUNCEMENT BAR ─── */}
      <SiteAnnouncementBar />

      {/* 3 ─── TOP HERO ─── */}
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
          <div className={`hero__actions ${showHeroButtons ? "hero__actions--visible" : ""}`}>
            <Link to="/donate" className="hero__btn hero__btn--primary">
              Start now
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
          <Link to="/about" className="intro-tagline__link">
            Our story <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </section>

      {/* 5 ─── WHAT WE DO — 4 PILLARS ─── */}
      <section id="mission" className="landing-section landing-section--light landing-section--mission-tail">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="landing-section__heading landing-section__heading--what-we-do">
              What We Do
            </h2>
            <p className="landing-section__mission-lead">
              Provide safety, healing, justice, and empowerment.
            </p>
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

      {/* 5b ─── GIVE: Philippines video + donate card (full-width section) ─── */}
      <section className="landing-donate-video landing-donate-video--featured" id="give">
        <div className="landing-donate-video__bg" aria-hidden="true">
          <img
            className="landing-donate-video__bg-img"
            src="/BackwardsJump.jpg"
            alt=""
            loading="lazy"
            decoding="async"
          />
          <video
            className="landing-donate-video__video"
            src="/philippines_video.mp4"
            poster="/BackwardsJump.jpg"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="landing-donate-video__overlay" />
        </div>
        <div className="landing-donate-video__inner">
          <h2 className="landing-donate-video__title">
            Support survivor care
            <span className="landing-donate-video__title-line">where it&apos;s needed most.</span>
          </h2>
          <p className="landing-donate-video__impact-kicker">Here&apos;s what your gift does</p>
          <p className="landing-donate-video__impact-copy">
            Your support keeps safe homes staffed, counseling available, and girls in school—so
            healing isn&apos;t interrupted by practical gaps.
          </p>
          <HeroDonateCard />
        </div>
      </section>

      {/* 6 ─── IMPACT STATS (trust-first, before quote) ─── */}
      <section id="impact" className="landing-section landing-section--dark landing-section--after-give">
        <div className="container text-center">
          <p className="landing-section__eyebrow landing-section__eyebrow--light">
            Our Impact
          </p>
          <h2 className="landing-section__heading landing-section__heading--light">
            Making a measurable difference
          </h2>
          <div className="row g-4 mt-3 justify-content-center">
            {impactStats.map((s) => (
              <div key={s.key} className="col-6 col-md-3">
                <AnimatedStat value={s.value} label={s.label} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7 ─── QUOTE / TESTIMONIAL ─── */}
      <section className="quote-section quote-section--airy">
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

      {/* 8 ─── FEATURED CAMPAIGN ─── */}
      <section className="landing-section landing-section--light">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <p className="landing-section__eyebrow">Featured Campaign</p>
              <h2 className="landing-section__heading campaign-heading">
                Wheels of Hope:<br />A Van That Changes Lives
              </h2>
              <p className="landing-section__body campaign-body-tight">
                Reliable transport means safety, court dates kept, and girls staying connected to
                care—not stuck waiting when every mile counts.
              </p>
              <Link to="/donate" className="btn btn-primary" style={{ borderRadius: 50 }}>
                Support This Campaign
              </Link>
            </div>
            <div className="col-lg-6">
              <figure className="campaign-media">
                <img
                  className="campaign-media__img"
                  src="/BackwardsJump.jpg"
                  alt="Girls holding hands and jumping together"
                  loading="lazy"
                  decoding="async"
                />
                <figcaption className="campaign-media__caption">Wheels of Hope — getting girls where they need to be, safely.</figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* 9 ─── OUR PROGRAMS ─── */}
      <section className="landing-section landing-section--accent landing-programs">
        <div className="container">
          <div className="landing-programs__intro text-center">
            <p className="landing-section__eyebrow">Our Programs &amp; Services</p>
            <h2 className="landing-programs__heading">
              Every child deserves to feel safe, known, and supported.
            </h2>
            <p className="landing-programs__sub">
              We care for the whole child through daily essentials, health and healing,
              and lasting belonging.
            </p>
          </div>
          <div className="row g-4 g-xl-5 justify-content-center landing-programs__grid">
            {programs.map((p) => (
              <div key={p.title} className="col-md-6 col-lg-4">
                <article className="program-card">
                  <div className="program-card__media">
                    <img
                      className="program-card__img"
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="program-card__text">
                    <h3 className="program-card__title">{p.title}</h3>
                    <ul className="program-card__list">
                      {p.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10 ─── GET INVOLVED (photo cards + glass CTA bar) ─── */}
      <section id="involved" className="landing-section landing-section--light landing-involve-rh">
        <div className="container">
          <p className="landing-involve-rh__eyebrow">Get involved</p>
          <div className="row landing-involve-rh__header g-4 g-lg-5">
            <div className="col-lg-5">
              <h2 className="landing-involve-rh__title">
                Improve lives with us
              </h2>
            </div>
            <div className="col-lg-7">
              <p className="landing-involve-rh__lead">
                There are many ways to stand with survivors of trafficking. Whether you give,
                partner with us, volunteer your time, or help amplify our story in your community,
                you make safe homes, counseling, and hope possible.
              </p>
              <p className="landing-involve-rh__lead landing-involve-rh__lead--muted mb-0">
                Choose a path below to learn more about how you can make a difference—every
                role matters in building a safer world for children and families.
              </p>
            </div>
          </div>
          <div className="row g-3 g-md-4">
            {waysToHelp.map((w) => (
              <div key={w.title} className="col-12 col-md-6 col-xl-3">
                <Link
                  to={w.link}
                  className="involve-photo-card"
                  aria-label={`${w.title}: ${w.description}`}
                >
                  <div
                    className="involve-photo-card__bg"
                    style={{ backgroundImage: `url(${w.image})` }}
                  />
                  <div className="involve-photo-card__scrim" aria-hidden="true" />
                  <h3 className="involve-photo-card__title">{w.title}</h3>
                  <div className="involve-photo-card__glass">
                    <span>Learn more</span>
                    <i className="bi bi-arrow-right involve-photo-card__arrow" aria-hidden="true" />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10b ─── UPCOMING EVENTS ─── */}
      <section className="landing-events" aria-labelledby="landing-events-heading">
        <div className="container">
          <div className="landing-events__head">
            <h2 id="landing-events-heading" className="landing-events__title">
              Upcoming events
            </h2>
          </div>

          <div className="landing-events__list" role="list">
            {upcomingEvents.map((event) => (
              <article className="landing-events__item" key={event.title} role="listitem">
                <div className="landing-events__date-box" aria-label={`${event.dayName} ${event.day} ${event.monthYear}`}>
                  <span className="landing-events__day-name">{event.dayName}</span>
                  <span className="landing-events__day">{event.day}</span>
                  <span className="landing-events__month">{event.monthYear}</span>
                </div>
                <div className="landing-events__details">
                  <h3 className="landing-events__event-title">{event.title}</h3>
                  <p className="landing-events__event-dates">{event.dates}</p>
                  <p className="landing-events__event-price">{event.price}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 11 ─── LATEST STORIES ─── */}
      <section className="landing-section landing-section--light landing-section--neutral-alt">
        <div className="container">
          <header className="landing-stories__head">
            <div className="landing-stories__head-left">
              <p className="landing-section__eyebrow mb-2">Latest Stories</p>
              <h2 className="landing-stories__title">
                News &amp; updates from Beacon
              </h2>
            </div>
            <div className="landing-stories__head-right">
              <p className="landing-stories__blurb">
                Stories from inside Beacon—updates, reflections, and milestones from our work with
                survivors and the community supporting them.
              </p>
            </div>
          </header>
          <div className="row g-4">
            {stories.map((s) => (
              <div key={s.title} className="col-md-4">
                <div className="story-card">
                  <div className="story-card__image">
                    <img
                      className="story-card__img"
                      src={s.image}
                      alt={s.title}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="story-card__body">
                    <span className="story-card__date">{s.date}</span>
                    <h5 className="story-card__title">{s.title}</h5>
                    <p className="story-card__excerpt">{s.excerpt}</p>
                    <Link to="/impact" className="story-card__read">
                      Read More &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12 ─── CTA BANNER (video, Radiating Hope–style) ─── */}
      <section className="landing-cta-video">
        <div className="container-fluid landing-cta-video__container">
          <div className="landing-cta-video__card">
            <video
              className="landing-cta-video__video"
              src="/cutelittlegirl.mp4"
              autoPlay
              muted
              loop
              playsInline
            />
            <div className="landing-cta-video__overlay" aria-hidden="true" />
            <div className="landing-cta-video__content">
              <p className="landing-cta-video__kicker">Ready to help us on our mission?</p>
              <div className="landing-cta-video__actions">
                <Link to="/register" className="landing-cta-video__btn">
                  Become a member
                </Link>
                <Link to="/donate" className="landing-cta-video__btn landing-cta-video__btn--ghost">
                  Donate
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 13 ─── FOOTER ─── */}
      <Footer />
    </div>
  );
}

export default LandingPage;
