import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mt-5 mb-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow-sm p-4 p-md-5">
            <h1 className="mb-4">Privacy Policy</h1>
            <p className="text-muted">Last updated: April 2026</p>

            <p>
              Beacon ("we", "our", or "us") is committed to protecting your personal data. 
              This privacy notice explains how we collect, use, and safeguard your information 
              when you visit our application and use our services.
            </p>

            <h3 className="mt-4">1. What data do we collect?</h3>
            <p>We collect the following data:</p>
            <ul>
              <li>Personal identification information (Name, email address, phone number, organization name).</li>
              <li>Authentication data (passwords are securely hashed; we do not store raw passwords).</li>
              <li>Third-party authentication profile data (if you choose to sign in via Google).</li>
              <li>Donation history and related financial allocation records.</li>
            </ul>

            <h3 className="mt-4">2. How do we collect your data?</h3>
            <p>You directly provide us with most of the data we collect. We collect data and process it when you:</p>
            <ul>
              <li>Register online or create a supporter profile.</li>
              <li>Log in using our local authentication or via a third-party provider like Google.</li>
              <li>Make a donation or interact with our donor dashboard.</li>
              <li>Use or view our website via your browser's cookies.</li>
            </ul>

            <h3 className="mt-4">3. How will we use your data?</h3>
            <p>We collect your data so that we can:</p>
            <ul>
              <li>Manage your account and securely authenticate your identity.</li>
              <li>Process your donations and generate your donor history dashboard.</li>
              <li>Contact you regarding your account, security alerts, or organization updates.</li>
            </ul>

            <h3 className="mt-4">4. What are your data protection rights?</h3>
            <p>We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:</p>
            <ul>
              <li>The right to access: You have the right to request copies of your personal data.</li>
              <li>The right to rectification: You have the right to request that we correct any information you believe is inaccurate.</li>
              <li>The right to erasure: You have the right to request that we erase your personal data, under certain conditions.</li>
              <li>The right to restrict processing: You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
              <li>The right to object to processing: You have the right to object to our processing of your personal data, under certain conditions.</li>
              <li>The right to data portability: You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.</li>
            </ul>

            <h3 className="mt-4">5. Cookies</h3>
            <p>
              Cookies are text files placed on your computer to collect standard Internet log information and visitor behavior information. 
              When you visit our application, we collect information from you automatically through cookies strictly necessary for the operation of the site, such as authentication sessions.
            </p>

            <h3 className="mt-4">6. Changes to our privacy policy</h3>
            <p>
              We keep our privacy policy under regular review and place any updates on this web page.
            </p>

            <div className="mt-5 text-center">
              <Link to="/" className="btn btn-primary">Return to Home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}