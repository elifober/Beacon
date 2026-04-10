import Footer from "../components/Footer";

const fbTooltip =
  "Opens Lighthouse Sanctuary on Facebook in a new browser tab.";
const ytTooltip =
  "Opens Lighthouse Sanctuary on YouTube in a new browser tab.";

function ContactPage() {
  return (
    <div className="contact-page beacon-page">
      <header className="contact-page__hero">
        <div className="contact-page__hero-bg" aria-hidden="true" />
        <div className="container">
          <p className="landing-section__eyebrow mb-2">Contact Beacon</p>
          <h1 className="landing-section__heading mb-3">Let&apos;s stay connected</h1>
          <p className="landing-section__body mb-0">
            Reach out with questions, follow along on social, or join our email updates
            to hear upcoming needs, milestones, and stories from the shelter.
          </p>
        </div>
      </header>

      <section className="contact-page__main">
        <div className="container">
          <div className="row g-4 mb-4 align-items-stretch">
            <div className="col-lg-6 d-flex">
              <article className="contact-page__card w-100 h-100">
                <h2 className="h4 mb-3">Contact info</h2>
                <p className="mb-2">
                  <strong>Phone:</strong>{" "}
                  <a href="tel:+18018313323">(801) 831-3323</a>
                </p>
                <p className="mb-2">
                  <strong>Email:</strong>{" "}
                  <a href="mailto:info@lighthousesanctuary.org">info@lighthousesanctuary.org</a>
                </p>
                <p className="mb-0">
                  <strong>EIN:</strong> 81-3220618
                </p>
              </article>
            </div>

            <div className="col-lg-6 d-flex">
              <article className="contact-page__card contact-page__card--glass w-100 h-100">
                <h2 className="h4 mb-3">Follow + join updates</h2>
                <p className="mb-3">
                  Stay in the loop through social media and our donor/community email thread.
                </p>
                <div className="contact-page__socials mb-0">
                  <a
                    className="contact-page__social"
                    href="https://www.facebook.com/LighthouseSanctuary"
                    target="_blank"
                    rel="noopener noreferrer"
                    title={fbTooltip}
                  >
                    Facebook
                  </a>
                  <a
                    className="contact-page__social"
                    href="https://www.youtube.com/@LighthouseSanctuary"
                    target="_blank"
                    rel="noopener noreferrer"
                    title={ytTooltip}
                  >
                    YouTube
                  </a>
                </div>
              </article>
            </div>
          </div>

          <div className="row g-4 mt-1 align-items-stretch">
            <div className="col-lg-6 d-flex">
              <article
                className="involve-photo-card involve-photo-card--contact w-100"
                aria-label="Community spaces"
              >
                <div
                  className="involve-photo-card__bg"
                  style={{ backgroundImage: "url(/garden.jpg)" }}
                />
                <div className="involve-photo-card__scrim" aria-hidden="true" />
                <h3 className="involve-photo-card__title">Community spaces</h3>
                <div className="involve-photo-card__glass">
                  <span>Safe places where growth can happen.</span>
                </div>
              </article>
            </div>
            <div className="col-lg-6 d-flex">
              <article
                className="involve-photo-card involve-photo-card--contact w-100"
                aria-label="On-site impact"
              >
                <div
                  className="involve-photo-card__bg"
                  style={{ backgroundImage: "url(/land.jpg)" }}
                />
                <div className="involve-photo-card__scrim" aria-hidden="true" />
                <h3 className="involve-photo-card__title">On-site impact</h3>
                <div className="involve-photo-card__glass">
                  <span>Every call and donation supports real places and people.</span>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default ContactPage;
