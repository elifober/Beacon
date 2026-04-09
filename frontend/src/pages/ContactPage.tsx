import Footer from "../components/Footer";

const boardMembers = [
  { name: "Julie Hernando", role: "President / Co-Founder", image: "/julie.jpg" },
  { name: "Lance Platt", role: "Vice President", image: "/Lance-Plattjpg.jpg" },
  { name: "Candace Kunze", role: "Secretary of the Board", image: "/candace.jpeg" },
  { name: "Kalli Kamauoha-Wilson", role: "Board Member", image: "/Kalli.jpg" },
  { name: "Russell J. Osguthorpe", role: "Board Member", image: "/Russell.jpg" },
  { name: "Apple Lanman", role: "Board Member", image: "/Lanman.jpeg" },
  { name: "Steven Shraedel", role: "Board Member", image: "/Steven.jpeg" },
] as const;

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
                  >
                    Facebook
                  </a>
                  <a
                    className="contact-page__social"
                    href="https://www.youtube.com/@LighthouseSanctuary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    YouTube
                  </a>
                </div>
              </article>
            </div>
          </div>

          <article className="contact-page__card">
            <h2 className="h4 mb-1">Beacon board</h2>
            <p className="contact-page__board-sub mb-3">
              The team helping steward operations, partnerships, and survivor support.
            </p>
            <div className="row g-4">
              {boardMembers.map((member) => (
                <div className="col-sm-6 col-lg-4 col-xl-3" key={member.name}>
                  <figure className="contact-page__board-member mb-0">
                    <div className="contact-page__board-photo-wrap">
                      <img
                        className={`contact-page__board-photo ${member.name === "Russell J. Osguthorpe" ? "contact-page__board-photo--russell" : ""} ${member.name === "Julie Hernando" ? "contact-page__board-photo--julie" : ""}`}
                        src={member.image}
                        alt={member.name}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <figcaption className="contact-page__board-copy">
                      <p className="contact-page__member-name mb-1">{member.name}</p>
                      <p className="contact-page__member-role mb-0">{member.role}</p>
                    </figcaption>
                  </figure>
                </div>
              ))}
            </div>
          </article>

          <div className="row g-4 mt-1 align-items-stretch">
            <div className="col-lg-6 d-flex">
              <article className="contact-page__card contact-page__photo-card w-100">
                <img
                  src="/garden.jpg"
                  alt="Beacon community garden"
                  className="contact-page__photo"
                  loading="lazy"
                  decoding="async"
                />
                <div className="contact-page__photo-glass">
                  <p className="mb-1">Community spaces</p>
                  <p className="mb-0">Safe places where growth can happen.</p>
                </div>
              </article>
            </div>
            <div className="col-lg-6 d-flex">
              <article className="contact-page__card contact-page__photo-card w-100">
                <img
                  src="/land.jpg"
                  alt="Beacon shelter surroundings"
                  className="contact-page__photo"
                  loading="lazy"
                  decoding="async"
                />
                <div className="contact-page__photo-glass">
                  <p className="mb-1">On-site impact</p>
                  <p className="mb-0">Every call and donation supports real places and people.</p>
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
