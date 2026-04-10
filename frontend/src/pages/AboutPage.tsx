import Footer from "../components/Footer";

const boardMembers = [
  {
    name: "Sione Tuiasoa",
    image: "/sioneheadshot.jpg",
    frameClass: "about-page__board-photo--sione",
    role: "Board Chair",
  },
  {
    name: "Elias Fobert",
    image: "/eliheadshot.jpeg",
    frameClass: "about-page__board-photo--eli",
    role: "Operations Lead",
  },
  {
    name: "Cole Evans",
    image: "/coleheadshot.jpg",
    frameClass: "",
    role: "Community Partnerships",
  },
  {
    name: "Brandon Price",
    image: "/brandonheadshot.PNG",
    frameClass: "about-page__board-photo--brandon",
    role: "Programs & Strategy",
  },
] as const;

const testimonials = [
  {
    quote:
      "Beacon was the light in my life when I felt like giving up. Having a safe place to heal felt like an answered prayer.",
    age: "16 years",
  },
  {
    quote:
      "At Beacon, we learned how to support each other through hard days, forgive, and keep building a sisterhood that lasts.",
    age: "15 years",
  },
  {
    quote:
      "When I was at my lowest, the team gave me comfort, hope, and consistent care. I will always remember feeling seen and loved.",
    age: "15 years",
  },
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
            Beacon is a 501(c)(3) organization (EIN 81-3220618) serving children-survivors
            of sexual abuse and trafficking in the Philippines.
          </p>
        </div>
      </header>

      <section className="about-page__content">
        <div className="container">
          <article className="about-page__card mb-4">
            <h2 className="h4 mb-3">Get to know us</h2>
            <p>
              There is a critical need in the Philippines for residential shelters that protect
              children escaping abuse and trafficking. Beacon serves female survivors ages 8 to
              18 through safe housing, counseling, medical support, and education.
            </p>
            <p>
              We currently operate two residential-style shelters that each care for up to 20
              children. Referrals come through government and anti-trafficking partners, and
              each child is supported by social workers while transitioning into a healing environment.
            </p>
            <p className="mb-0">
              Our long-term goal is safe reintegration into family life and community, with
              family counseling and coordinated support through DSWD and trusted local partners
              who walk with each child through recovery.
            </p>
          </article>

          <article className="about-page__feature-block mb-4">
            <h2 className="h4 mb-3">Life at Beacon</h2>
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

          <article className="about-page__card mb-4">
            <h2 className="h4 mb-1">Voices from the girls we serve</h2>
            <p className="about-page__board-sub mb-3">
              These testimonials are from survivors in Beacon care, not from board members.
            </p>
            <div className="row g-3">
              {testimonials.map((item) => (
                <div className="col-12 col-lg-4" key={item.quote}>
                  <article className="about-page__testimonial-card">
                    <p className="about-page__testimonial-tag mb-2">Survivor voice</p>
                    <p className="about-page__testimonial-quote mb-2">"{item.quote}"</p>
                    <p className="about-page__testimonial-age mb-0">{item.age}</p>
                  </article>
                </div>
              ))}
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
                        className={`about-page__board-photo ${member.frameClass}`.trim()}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="about-page__board-copy">
                      <p className="about-page__member-name mb-0">{member.name}</p>
                      <p className="about-page__member-role mb-0">{member.role}</p>
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
