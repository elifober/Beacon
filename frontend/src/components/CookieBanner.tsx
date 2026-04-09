import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCookieConsent } from "../context/CookieConsentContext";

/**
 * GDPR-oriented cookie UI:
 * - Persists the user's category choice (strictly necessary vs necessary + optional preferences).
 * - Optional preferences (e.g. remembered admin search) are only written when user chooses "Accept all".
 * See /cookie-policy and Privacy Policy § Cookies.
 */
export default function CookieBanner() {
  const {
    choice,
    setChoiceAndPersist,
    preferenceCenterOpen,
    openCookiePreferences,
    closeCookiePreferences,
  } = useCookieConsent();

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const showBanner = hydrated && choice === "unset";
  const showCenter = preferenceCenterOpen;

  useEffect(() => {
    if (!showCenter) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCookiePreferences();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCenter, closeCookiePreferences]);

  if (!showBanner && !showCenter) return null;

  return (
    <>
      {showCenter && (
        <div
          className="cookie-consent-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ zIndex: 1060, background: "rgba(27, 38, 29, 0.55)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-title"
          onClick={closeCookiePreferences}
        >
          <div
            className="card shadow-lg border-0"
            style={{ maxWidth: "32rem", width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-body p-4">
              <h2 id="cookie-preferences-title" className="h5 mb-3">
                Cookie preferences
              </h2>
              <p className="text-muted small mb-3">
                Choose how Beacon may use storage in your browser. Authentication cookies on our
                server are always required when you sign in; this choice controls{" "}
                <strong>optional</strong> local preferences (for example, remembering your admin
                search text).
              </p>
              <ul className="small mb-4">
                <li>
                  <strong>Necessary only</strong> — session cookies from our API when you log in;
                  plus a small record of this choice. Optional preferences are not saved.
                </li>
                <li className="mt-2">
                  <strong>Accept all</strong> — same as necessary, plus optional local storage to
                  remember UI preferences across visits.
                </li>
              </ul>
              <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={closeCookiePreferences}
                >
                  Close
                </button>
                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setChoiceAndPersist("essential")}
                  >
                    Necessary only
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setChoiceAndPersist("all")}
                  >
                    Accept all
                  </button>
                </div>
              </div>
              <p className="small text-muted mt-3 mb-0">
                <Link to="/cookie-policy">Cookie policy</Link>
                {" · "}
                <Link to="/privacy-policy">Privacy policy</Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {showBanner && (
        <div
          className="fixed-bottom p-3 text-white shadow-lg cookie-consent-bar"
          style={{
            zIndex: 1050,
            background: "var(--beacon-primary-dark, #1F3A25)",
            borderTop: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div className="container">
            <div className="row align-items-start align-items-md-center g-3">
              <div className="col-md-8">
                <p className="mb-1 small fw-semibold">Cookies and your privacy</p>
                <p className="mb-0 small" style={{ opacity: 0.92 }}>
                  We use strictly necessary cookies on our servers to keep your account secure when
                  you sign in. With your permission, we can also store optional preferences in your
                  browser (for example, remembering admin search text). Read our{" "}
                  <Link to="/privacy-policy" className="text-white text-decoration-underline">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link to="/cookie-policy" className="text-white text-decoration-underline">
                    Cookie Policy
                  </Link>
                  .
                </p>
              </div>
              <div className="col-md-4 text-md-end">
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm me-2 mb-2 mb-md-0"
                  onClick={() => setChoiceAndPersist("essential")}
                >
                  Necessary only
                </button>
                <button
                  type="button"
                  className="btn btn-light btn-sm text-dark me-2 mb-2 mb-md-0"
                  onClick={() => setChoiceAndPersist("all")}
                >
                  Accept all
                </button>
                <button
                  type="button"
                  className="btn btn-link btn-sm text-white text-decoration-underline p-0 mb-2 mb-md-0 d-block d-md-inline ms-md-2"
                  onClick={openCookiePreferences}
                >
                  Manage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
