import { Link } from "react-router-dom";

/** Compact donate strip: green DONATE control + impact copy + link to /donate */
export function DonateInlineBanner() {
  return (
    <section className="donate-inline-banner" aria-label="Support Lighthouse Sanctuary">
      <div className="container py-3 py-md-4">
        <div className="donate-inline-banner__inner">
          <Link to="/donate" className="donate-inline-banner__btn">
            Donate
          </Link>
          <p className="donate-inline-banner__text mb-0">
            <span className="donate-inline-banner__lead">
              100% of every gift goes directly to safe homes and healing for survivors of trafficking.{" "}
            </span>
            <Link to="/donate" className="donate-inline-banner__text-link">
              Give hope today <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
