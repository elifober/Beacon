import { Link } from "react-router-dom";
import { DonateInlineBanner } from "../components/DonateInlineBanner";
import Footer from "../components/Footer";

const impactPosts = [
  {
    title: "Highs and Lows of Lighthouse",
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

const impactStats = [
  { label: "Children served", value: "100+" },
  { label: "Residential shelters", value: "2" },
  { label: "Current residents mentioned", value: "15" },
  { label: "Years of operation", value: "5+" },
] as const;

function ImpactPage() {
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
            A look at milestones and reflections from the Lighthouse Sanctuary blog,
            reimagined in Beacon&apos;s updated visual style.
          </p>
        </div>
      </header>

      <section className="impact-page__content">
        <div className="container">
          <div className="row g-3 mb-4">
            {impactStats.map((stat) => (
              <div className="col-6 col-lg-3" key={stat.label}>
                <div className="impact-page__stat">
                  <p className="impact-page__stat-value mb-1">{stat.value}</p>
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

          <div className="impact-page__cta mt-4">
            <p className="mb-2">
              Want ongoing story updates and opportunities to help in real time?
            </p>
            <div className="impact-page__cta-actions">
              <Link to="/donate" className="impact-page__cta-btn">
                Donate now
              </Link>
              <a
                href="mailto:info@lighthousesanctuary.org?subject=Impact%20Story%20Email%20Updates"
                className="impact-page__cta-btn impact-page__cta-btn--ghost"
              >
                Join email thread
              </a>
            </div>
          </div>
        </div>
      </section>

      <DonateInlineBanner />
      <Footer />
    </div>
  );
}

export default ImpactPage;
