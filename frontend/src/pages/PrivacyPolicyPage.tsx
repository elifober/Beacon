import { Link } from "react-router-dom";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mt-5 mb-5 beacon-page">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow-sm p-4 p-md-5">
            <h1 className="mb-3">Privacy Policy</h1>
            <p className="text-muted">Last updated: April 2026</p>

            <p>
              Beacon Sanctuary (&quot;Beacon,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
              operates this web application to support our mission related to safehouse operations,
              partnerships, and fundraising. This Privacy Policy explains how we collect, use,
              store, and share personal data when you use our application and website, in line with
              the EU General Data Protection Regulation (GDPR) and related transparency
              expectations.
            </p>

            <h2 className="h4 mt-4">1. Data controller</h2>
            <p>
              The data controller responsible for personal data processed through this application
              is Beacon Sanctuary. For privacy requests, contact us at{" "}
              <a href="mailto:info@beaconsanctuary.org">info@beaconsanctuary.org</a>.
            </p>
            <p className="small text-muted mb-0">
              <strong>Note:</strong> This application may be deployed for educational or
              demonstration purposes; if you are using a class or test instance, your instructor or
              host may act as a joint processor for that environment. This policy describes our
              intended production-style practices.
            </p>

            <h2 className="h4 mt-4">2. What personal data we collect</h2>
            <p>Depending on how you use Beacon, we may process:</p>
            <ul>
              <li>
                <strong>Identity and contact data:</strong> name, email address, phone number,
                organization name (for example when you register as a supporter or partner).
              </li>
              <li>
                <strong>Authentication data:</strong> credentials for local accounts (passwords are
                hashed; we do not store plaintext passwords). If you use Google sign-in, we receive
                profile identifiers from Google subject to your Google account settings.
              </li>
              <li>
                <strong>Donation-related data:</strong> donation records, allocations, and
                dashboard information you view as a donor or administer as staff.
              </li>
              <li>
                <strong>Operational and safeguarding data (authorized roles):</strong> where
                applicable, information about residents, safehouses, partners, risk assessments,
                and related records visible only to appropriately authorized users. This may include
                sensitive categories of data where permitted by law and organizational policy.
              </li>
              <li>
                <strong>Technical data:</strong> IP address, browser type, and standard server logs
                may be processed by our hosting providers when you access the service.
              </li>
            </ul>

            <h2 className="h4 mt-4">3. How we collect your data</h2>
            <p>We obtain personal data when you:</p>
            <ul>
              <li>Register an account, complete your profile, or sign in (including via Google).</li>
              <li>Make a donation or use donor-facing features.</li>
              <li>Submit information through forms or admin workflows you are permitted to use.</li>
              <li>Browse the site; limited technical data is collected automatically.</li>
            </ul>

            <h2 className="h4 mt-4">4. Purposes and legal bases (GDPR)</h2>
            <p>We process personal data for the following purposes, based on these legal bases:</p>
            <ul>
              <li>
                <strong>Providing the service and performing a contract</strong> (Art. 6(1)(b)
                GDPR): operating accounts, authentication, donor tools, and role-based access to
                features you have signed up for.
              </li>
              <li>
                <strong>Legitimate interests</strong> (Art. 6(1)(f) GDPR): securing the application,
                preventing abuse, improving reliability, and analyzing aggregated usage where it
                does not override your rights.
              </li>
              <li>
                <strong>Legal obligation</strong> (Art. 6(1)(c) GDPR): where we must retain or
                disclose information to comply with law.
              </li>
              <li>
                <strong>Consent</strong> (Art. 6(1)(a) GDPR): where we ask for optional browser
                preferences (see our{" "}
                <Link to="/cookie-policy">Cookie Policy</Link>
                ). Strictly necessary authentication cookies do not rely on this consent in the same
                way as optional storage.
              </li>
            </ul>

            <h2 className="h4 mt-4">5. How we use your data</h2>
            <ul>
              <li>To create and manage user accounts and roles (supporter, partner, administrator).</li>
              <li>To process and display donations and allocation information.</li>
              <li>
                To support safehouse, partner, and resident workflows for authorized personnel.
              </li>
              <li>To communicate with you about your account, security, or operational needs.</li>
              <li>To comply with law and enforce our terms and safeguards.</li>
            </ul>

            <h2 className="h4 mt-4">6. Sharing and processors</h2>
            <p>
              We do not sell your personal data. We may share data with service providers who host
              our application or provide infrastructure (for example cloud hosting, database, and
              authentication-related services), strictly as needed to operate Beacon. Such providers
              process data on our instructions. Where sign-in with Google is enabled, Google
              processes data under its own policies during the OAuth flow.
            </p>

            <h2 className="h4 mt-4">7. International transfers</h2>
            <p>
              If data is stored or processed outside the European Economic Area, we rely on
              appropriate safeguards where required (such as standard contractual clauses or
              adequacy decisions), consistent with our hosting configuration.
            </p>

            <h2 className="h4 mt-4">8. Retention</h2>
            <p>
              We retain personal data only as long as necessary for the purposes above, including
              legal, accounting, or reporting requirements. Account and operational retention periods
              depend on organizational policy; contact us to discuss deletion timelines for your
              data.
            </p>

            <h2 className="h4 mt-4">9. Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect personal
              data, including transport encryption (HTTPS), access controls, and secure password
              hashing. No method of transmission over the Internet is completely secure; we strive to
              follow industry practices appropriate to the sensitivity of the information.
            </p>

            <h2 className="h4 mt-4">10. Your rights under GDPR</h2>
            <p>If GDPR applies to our processing of your data, you may have the right to:</p>
            <ul>
              <li>
                <strong>Access</strong> your personal data and receive a copy.
              </li>
              <li>
                <strong>Rectification</strong> of inaccurate data.
              </li>
              <li>
                <strong>Erasure</strong> (&quot;right to be forgotten&quot;) in certain circumstances.
              </li>
              <li>
                <strong>Restriction</strong> of processing in certain circumstances.
              </li>
              <li>
                <strong>Data portability</strong> for data you provided, where processing is based on
                consent or contract and is automated.
              </li>
              <li>
                <strong>Object</strong> to processing based on legitimate interests.
              </li>
              <li>
                <strong>Withdraw consent</strong> at any time, where processing is based on consent,
                without affecting the lawfulness of processing before withdrawal.
              </li>
              <li>
                <strong>Lodge a complaint</strong> with a supervisory authority in your country of
                residence.
              </li>
            </ul>
            <p>
              To exercise these rights, contact{" "}
              <a href="mailto:info@beaconsanctuary.org">info@beaconsanctuary.org</a>. We will
              respond within the timeframes required by law.
            </p>

            <h2 className="h4 mt-4">11. Children</h2>
            <p>
              Our public registration and donor flows are not directed at children. Resident-related
              data in the system is handled under strict organizational and legal safeguards by
              authorized staff only.
            </p>

            <h2 className="h4 mt-4">12. Cookies and similar technologies</h2>
            <p>
              We use cookies and, with your permission, limited local browser storage for optional
              preferences. For a detailed list, legal characterization, and how to change your choice,
              see our <Link to="/cookie-policy">Cookie Policy</Link>.
            </p>

            <h2 className="h4 mt-4">13. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy to reflect changes in our practices or legal
              requirements. We will revise the &quot;Last updated&quot; date and, where appropriate,
              provide additional notice (for example via the application or email).
            </p>

            <div className="mt-5 d-flex flex-wrap gap-2 justify-content-center">
              <Link to="/" className="btn btn-primary">
                Return to Home
              </Link>
              <Link to="/cookie-policy" className="btn btn-outline-primary">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
