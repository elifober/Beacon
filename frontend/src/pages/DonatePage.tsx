import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  donateDisplay,
  donateLinks,
  hasAnyPaymentLink,
  paypalHref,
} from "../config/donate";

const PRESET_AMOUNTS = [25, 50, 100, 250];

/**
 * PayPal / Lighthouse-style third-party checkout: amount, frequency, then
 * outbound links to your processor (configure URLs in env).
 */
function DonatePage() {
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState<string>("");
  const [monthly, setMonthly] = useState(false);
  const [fromLandingNote, setFromLandingNote] = useState<string | null>(null);

  useEffect(() => {
    const a = searchParams.get("amount");
    const m = searchParams.get("monthly");
    const n = searchParams.get("note");
    if (a != null && a.trim() !== "") setAmount(a.trim());
    if (m === "1") setMonthly(true);
    if (n != null && n.trim() !== "") setFromLandingNote(n.trim());
  }, [searchParams]);

  const paypalUrl = paypalHref(monthly);
  const anyLink = hasAnyPaymentLink();

  return (
    <div className="donate-external">
      <div className="donate-external__bg" aria-hidden="true">
        <video
          className="donate-external__bg-video"
          src="/flag.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="donate-external__bg-overlay" />
      </div>
      <div className="donate-external__wrap">
        <div className="donate-external__card">
          <div className="donate-external__brand">
            <img src="/logo.png" alt="" className="donate-external__logo" />
          </div>
          <p className="donate-external__preline">Donate to</p>
          <h1 className="donate-external__org">
            {donateDisplay.orgName}
            <span className="donate-external__verified" title="Official donation page">
              <i className="bi bi-patch-check-fill" aria-hidden="true" />
            </span>
          </h1>

          {fromLandingNote && (
            <div className="donate-external__setup-note mb-3" role="note">
              <p className="mb-0 fw-semibold text-dark">Your note</p>
              <p className="mb-0 mt-1 small">{fromLandingNote}</p>
            </div>
          )}

          <div className="donate-external__amount-block">
            <label className="visually-hidden" htmlFor="donate-amount">
              Donation amount
            </label>
            <div className="donate-external__amount-row">
              <span className="donate-external__currency" aria-hidden="true">
                {donateDisplay.currencySymbol}
              </span>
              <input
                id="donate-amount"
                type="text"
                inputMode="decimal"
                className="donate-external__amount-input"
                placeholder="0"
                autoComplete="off"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, "");
                  setAmount(v);
                }}
              />
            </div>
            <p className="donate-external__currency-code">{donateDisplay.currencyCode}</p>
            <div className="donate-external__presets" role="group" aria-label="Suggested amounts">
              {PRESET_AMOUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className="donate-external__preset"
                  onClick={() => setAmount(String(n))}
                >
                  {donateDisplay.currencySymbol}
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="donate-external__frequency">
            <span className="donate-external__frequency-label">Frequency</span>
            <div className="donate-external__toggle" role="group" aria-label="Donation frequency">
              <button
                type="button"
                className={`donate-external__toggle-btn ${!monthly ? "donate-external__toggle-btn--active" : ""}`}
                onClick={() => setMonthly(false)}
              >
                One-time
              </button>
              <button
                type="button"
                className={`donate-external__toggle-btn ${monthly ? "donate-external__toggle-btn--active" : ""}`}
                onClick={() => setMonthly(true)}
              >
                Monthly
              </button>
            </div>
          </div>

          {!anyLink && (
            <div className="donate-external__setup-note" role="status">
              <p>
                Payment buttons will appear here once your team adds third-party
                donate links (for example PayPal hosted donate URLs) to the frontend
                environment variables. See <code>.env.example</code>.
              </p>
              <p className="mb-0">
                Questions?{" "}
                <a href="mailto:info@beaconsanctuary.org">info@beaconsanctuary.org</a>
              </p>
            </div>
          )}

          <div className="donate-external__actions">
            {paypalUrl && (
              <a
                href={paypalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="donate-external__btn donate-external__btn--paypal"
              >
                <svg className="donate-external__pp-logo" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#003087"
                    d="M7.6 19.5H4.4c-.3 0-.5-.2-.5-.5l-1.8-11c0-.2.1-.4.3-.4h4.8c2.4 0 4.2 1 4.9 3 .1.3.2.6.2 1 0 2.5-1.7 4.3-4.9 4.3h-1.2c-.2 0-.4.2-.4.4l-.8 3.2z"
                  />
                  <path
                    fill="#009cde"
                    d="M18.2 8.5c0 3.5-2.4 6-6.6 6H9.4L8 19.5c0 .3.2.5.5.5h3.9c.2 0 .4-.2.4-.4v-.1l.7-2.8v-.1c0-.2.2-.4.4-.4h.2c2.9 0 5.2-1.2 5.9-4.5.2-1 .1-2-.1-2.7z"
                  />
                </svg>
                Donate with PayPal
              </a>
            )}
            {donateLinks.venmo && (
              <a
                href={donateLinks.venmo}
                target="_blank"
                rel="noopener noreferrer"
                className="donate-external__btn donate-external__btn--venmo"
              >
                <span className="donate-external__venmo-mark">v</span>
                Donate with Venmo
              </a>
            )}
            {donateLinks.debitOrCard && (
              <a
                href={donateLinks.debitOrCard}
                target="_blank"
                rel="noopener noreferrer"
                className="donate-external__btn donate-external__btn--card"
              >
                Donate with Debit or Credit Card
              </a>
            )}
          </div>

          <p className="donate-external__fineprint">
            You will complete payment on your provider&apos;s secure site. The amount
            shown here is for your reference; enter the same amount there unless your
            link is preset.
          </p>

          <p className="donate-external__back">
            <Link to="/">&larr; Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default DonatePage;
