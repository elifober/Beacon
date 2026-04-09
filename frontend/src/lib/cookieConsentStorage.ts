export type CookieConsentChoice = "unset" | "essential" | "all";

const V2_KEY = "beacon_cookie_consent_v2";
const LEGACY_KEY = "beacon_cookie_consent";

export interface StoredConsent {
  choice: "essential" | "all";
  version: number;
  updatedAt: string;
}

export const PREF_KEY_ADMIN_SEARCH = "beacon_pref_admin_search";

/** Keys we only persist when the user accepts optional (preference) storage. */
export const OPTIONAL_LOCAL_PREF_KEYS = [PREF_KEY_ADMIN_SEARCH] as const;

export function readConsent(): CookieConsentChoice {
  if (typeof window === "undefined") return "unset";
  const raw = localStorage.getItem(V2_KEY);
  if (raw) {
    try {
      const o = JSON.parse(raw) as StoredConsent;
      if (o.choice === "essential" || o.choice === "all") return o.choice;
    } catch {
      /* ignore */
    }
  }
  const leg = localStorage.getItem(LEGACY_KEY);
  if (leg === "accepted") return "all";
  if (leg === "declined") return "essential";
  return "unset";
}

export function writeConsent(choice: "essential" | "all"): void {
  const payload: StoredConsent = {
    choice,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(V2_KEY, JSON.stringify(payload));
  localStorage.removeItem(LEGACY_KEY);
}

export function clearConsentStorage(): void {
  localStorage.removeItem(V2_KEY);
  localStorage.removeItem(LEGACY_KEY);
}

export function clearOptionalPreferenceKeys(): void {
  for (const k of OPTIONAL_LOCAL_PREF_KEYS) {
    localStorage.removeItem(k);
  }
}
