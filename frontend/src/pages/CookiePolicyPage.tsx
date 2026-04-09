import { Link } from "react-router-dom";
import { useCookieConsent } from "../context/CookieConsentContext";

function OpenCookiePreferencesInline() {
  const { openCookiePreferences } = useCookieConsent();
  return (
    <button
      type="button"
      className="btn btn-outline-primary btn-sm mb-3"
      onClick={openCookiePreferences}
    >
      Open cookie preference center
    </button>
  );
}

function CookieChoiceReset() {
  const { resetConsentForBanner } = useCookieConsent();
  return (
    <p className="small text-muted border-top pt-3 mt-4">
      <button
        type="button"
        className="btn btn-link btn-sm p-0 align-baseline"
        onClick={resetConsentForBanner}
      >
        Show first-visit cookie banner again
      </button>{" "}
      — clears your saved choice and optional preference keys in this browser (useful for testing
      or if you share a device).
    </p>
  );
}

export default function CookiePolicyPage() {
  return (
    <div className="container mt-5 mb-5 beacon-page">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow-sm p-4 p-md-5">
            <h1 className="mb-3">Cookie Policy</h1>
            <p className="text-muted">Last updated: April 2026</p>

            <OpenCookiePreferencesInline />

            <p>
              This Cookie Policy describes how Beacon Sanctuary (&quot;Beacon,&quot; &quot;we,&quot;
              &quot;us&quot;) uses cookies and similar technologies in connection with our web
              application. It should be read together with our{" "}
              <Link to="/privacy-policy">Privacy Policy</Link>.
            </p>

            <h2 className="h4 mt-4">1. What are cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. We also
              use the term below to include functionally similar browser storage (such as{" "}
              <code>localStorage</code>) where we describe optional preferences.
            </p>

            <h2 className="h4 mt-4">2. How you control cookies</h2>
            <p>
              When you first visit our site, we show a cookie notice. You may choose{" "}
              <strong>Necessary only</strong> or <strong>Accept all</strong>. You can reopen
              preferences anytime from the footer link <strong>Cookie preferences</strong>. Your
              choice is stored in your browser so we do not ask on every visit.
            </p>
            <ul>
              <li>
                <strong>Necessary only</strong> — We rely on essential authentication cookies from
                our API when you log in. We also store a small record of your cookie choice. We do{" "}
                <em>not</em> persist optional UI preferences in your browser under this option.
              </li>
              <li>
                <strong>Accept all</strong> — Includes everything in Necessary only, and allows us
                to remember certain optional preferences locally (for example, admin search text)
                across sessions.
              </li>
            </ul>

            <h2 className="h4 mt-4">3. Cookies and storage we use</h2>
            <div className="table-responsive mt-3">
              <table className="table table-bordered table-sm align-middle">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Name / key</th>
                    <th scope="col">Type</th>
                    <th scope="col">Purpose</th>
                    <th scope="col">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>.AspNetCore.Identity.Application</code> (or similar)
                    </td>
                    <td>HTTP cookie (first-party, API host)</td>
                    <td>
                      Maintains your signed-in session after you authenticate with email/password or
                      Google. Required for secure access to donor, partner, and admin features.
                    </td>
                    <td>Session / up to 7 days (sliding), per server configuration</td>
                  </tr>
                  <tr>
                    <td>OAuth / correlation cookies</td>
                    <td>HTTP cookie (API host)</td>
                    <td>
                      Short-lived cookies used only during external sign-in (e.g. Google) to
                      complete login securely.
                    </td>
                    <td>Minutes; cleared after sign-in completes</td>
                  </tr>
                  <tr>
                    <td>
                      <code>beacon_cookie_consent_v2</code>
                    </td>
                    <td>
                      <code>localStorage</code> (this site)
                    </td>
                    <td>
                      Records your cookie preference (necessary only vs accept all) and when it was
                      updated.
                    </td>
                    <td>Until you clear site data or use &quot;Reset cookie choice&quot;</td>
                  </tr>
                  <tr>
                    <td>
                      <code>beacon_pref_admin_search</code>
                    </td>
                    <td>
                      <code>localStorage</code> (this site)
                    </td>
                    <td>
                      Optionally remembers the global admin search query across visits.{" "}
                      <strong>Only written if you choose Accept all.</strong>
                    </td>
                    <td>Until you clear site data, change preference to Necessary only, or clear</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="h4 mt-4">4. Strictly necessary cookies</h2>
            <p>
              Authentication cookies are strictly necessary to provide the service you request
              (accessing your account and role-protected data). They are issued by our ASP.NET Core
              API when you sign in. You can remove them by signing out and clearing cookies for our
              API domain, but you will not remain logged in.
            </p>

            <h2 className="h4 mt-4">5. Optional preferences</h2>
            <p>
              If you choose <strong>Necessary only</strong>, we do not store optional preference keys
              in <code>localStorage</code>. If you later choose <strong>Accept all</strong>, we may
              store the preferences described above. Switching back to Necessary only clears those
              optional keys from your browser.
            </p>

            <h2 className="h4 mt-4">6. Changes</h2>
            <p>
              We may update this Cookie Policy when we change how we use cookies. We will adjust the
              &quot;Last updated&quot; date and, where appropriate, prompt you to review your
              preferences again.
            </p>

            <p className="mt-4 mb-0">
              Questions? Contact{" "}
              <a href="mailto:info@beaconsanctuary.org">info@beaconsanctuary.org</a>.
            </p>

            <CookieChoiceReset />

            <div className="mt-4 text-center">
              <Link to="/" className="btn btn-primary me-2">
                Return to Home
              </Link>
              <Link to="/privacy-policy" className="btn btn-outline-primary">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
