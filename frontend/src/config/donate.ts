/**
 * Third-party donation URLs (PayPal hosted donate, Venmo, etc.).
 * Set these in `.env` — see `.env.example`.
 */
function env(name: `VITE_${string}`): string {
  const v = (import.meta.env as Record<string, string | boolean | undefined>)[name];
  return typeof v === "string" ? v.trim() : "";
}

export const donateLinks = {
  paypalOneTime: env("VITE_DONATE_PAYPAL_ONE_TIME") || env("VITE_DONATE_PAYPAL_URL"),
  paypalMonthly: env("VITE_DONATE_PAYPAL_MONTHLY") || env("VITE_DONATE_PAYPAL_URL"),
  venmo: env("VITE_DONATE_VENMO_URL"),
  debitOrCard: env("VITE_DONATE_CARD_URL"),
};

export const donateDisplay = {
  orgName: env("VITE_DONATE_ORG_NAME") || "Beacon",
  currencyCode: env("VITE_DONATE_CURRENCY_CODE") || "USD",
  /** Shown next to the amount (e.g. $, ₱) */
  currencySymbol: env("VITE_DONATE_CURRENCY_SYMBOL") || "$",
};

export function paypalHref(isMonthly: boolean): string {
  if (isMonthly) {
    return donateLinks.paypalMonthly || donateLinks.paypalOneTime;
  }
  return donateLinks.paypalOneTime || donateLinks.paypalMonthly;
}

export function hasAnyPaymentLink(): boolean {
  return Boolean(
    donateLinks.paypalOneTime ||
      donateLinks.paypalMonthly ||
      donateLinks.venmo ||
      donateLinks.debitOrCard
  );
}
