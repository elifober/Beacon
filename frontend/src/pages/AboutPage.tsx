import Footer from "../components/Footer";

const boardMembers = [
  { name: "Sione Tuiasoa", image: "/sioneheadshot.jpg" },
  { name: "Elias Fobert", image: "/eliheadshot.jpeg" },
  { name: "Cole Evans", image: "/coleheadshot.jpg" },
  { name: "Brandon Price", image: "/brandonheadshot.PNG" },
] as const;

function AboutPage() {
  return (
    <div className="about-page beacon-page">
      <header className="about-page__hero">
        <div className="about-page__hero-overlay" aria-hidden="true" />
        <div className="container about-page__hero-inner">
          <p className="landing-section__eyebrow landing-section__eyebrow--light mb-2">About us</p>
          <h1 className="about-page__title mb-3">Safety, Healing, and Empowerment</h1>
          <p className="about-page__lead mb-0">
            Lighthouse Sanctuary is a 501(c)(3) organization (EIN 81-3220618) serving
            children-survivors of sexual abuse and trafficking in the Philippines.
          </p>
        </div>
      </header>

      <section className="about-page__content">
        <div className="container">
          <article className="about-page__card mb-4">
            <h2 className="h4 mb-3">Get to know us</h2>
            <p>
              There is a great need for residential shelters in the Philippines for children
              trapped in abuse and trafficking. Lighthouse Sanctuary serves female survivors
              ages 8 to 18 through safe shelter, counseling, medical support, and education.
            </p>
            <p>
              We currently operate two residential-style shelters that can serve up to 20
              children each. Children are referred through government and anti-trafficking
              partners, then supported by social workers as they transition into a healing environment.
            </p>
            <p className="mb-0">
              Our long-term goal is safe reintegration into family life and society, with family
              counseling and coordinated support through DSWD and trusted community partners.
            </p>
          </article>

          <article className="about-page__feature-block mb-4">
            <h2 className="h4 mb-3">Life at Lighthouse</h2>
            <div className="impact-page__feature-media about-page__feature-media mb-0">
              <video
                className="impact-page__feature-video"
                src="/swing.mp4"
                autoPlay
                muted
                loop
                playsInline
              />
              <div className="impact-page__feature-overlay" aria-hidden="true" />
              <div className="impact-page__feature-copy">
                <p className="mb-1">Moments that matter</p>
                <h3 className="h4 mb-0">Real joy and healing in progress</h3>
              </div>
            </div>
          </article>

          <article className="about-page__card">
            <h2 className="h4 mb-1">Beacon board</h2>
            <p className="about-page__board-sub mb-3">
              The leaders guiding strategy, stewardship, and long-term care for survivors.
            </p>
            <div className="row g-4">
              {boardMembers.map((member) => (
                <div className="col-sm-6 col-lg-3" key={member.name}>
                  <div className="about-page__board-member mb-0">
                    <div className="about-page__board-photo-wrap">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="about-page__board-photo"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="about-page__board-copy">
                      <p className="about-page__member-name mb-0">{member.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default AboutPage;
