import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="landing-footer">
      <div className="container">
        <div className="row g-4 align-items-start landing-footer__grid">
          <div className="col-md-2 col-lg-2 text-center text-md-start">
            <img
              src="/logo.png"
              alt="Beacon"
              className="landing-footer__logo landing-footer__logo--aside"
            />
          </div>
          <div className="col-md-4 col-lg-4">
            <p className="landing-footer__text landing-footer__quote">
              We treat each other as family where each individual is seen,
              heard, and loved. We create fun memories, we fight for justice,
              and we acknowledge God in all we do.
            </p>
          </div>
          <div className="col-6 col-md-2 col-lg-2">
            <h6 className="landing-footer__heading">About</h6>
            <ul className="landing-footer__list">
              <li><a href="/#mission">Our Mission</a></li>
              <li><Link to="/login">Sign in</Link></li>
            </ul>
          </div>
          <div className="col-6 col-md-2 col-lg-2">
            <h6 className="landing-footer__heading">Get Involved</h6>
            <ul className="landing-footer__list">
              <li><Link to="/donate">Donate</Link></li>
              <li><Link to="/register">Partner</Link></li>
              <li><Link to="/register">Volunteer</Link></li>
            </ul>
          </div>
          <div className="col-md-12 col-lg-2">
            <h6 className="landing-footer__heading">Contact</h6>
            <p className="landing-footer__text">
              Have questions? Reach out to us at{" "}
              <a href="mailto:info@beaconsanctuary.org">info@beaconsanctuary.org</a>
            </p>
            <div className="landing-footer__socials" aria-label="Beacon social media links">
              <a
                className="landing-footer__social-link"
                href="https://www.youtube.com/@LighthouseSanctuary"
                target="_blank"
                rel="noopener noreferrer"
                title="Opens Lighthouse Sanctuary on YouTube in a new browser tab."
                aria-label="Visit Lighthouse Sanctuary on YouTube"
              >
                <i className="bi bi-youtube" aria-hidden="true" />
              </a>
              <a
                className="landing-footer__social-link"
                href="https://www.facebook.com/LighthouseSanctuary"
                target="_blank"
                rel="noopener noreferrer"
                title="Opens Lighthouse Sanctuary on Facebook in a new browser tab."
                aria-label="Visit Lighthouse Sanctuary on Facebook"
              >
                <i className="bi bi-facebook" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
        <hr className="landing-footer__rule" />
        <p className="landing-footer__copy">
          &copy; {new Date().getFullYear()} Beacon Sanctuary. All rights reserved. | <Link to="/privacy-policy">Privacy Policy</Link>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
