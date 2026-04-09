import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearConsentStorage,
  clearOptionalPreferenceKeys,
  readConsent,
  writeConsent,
  type CookieConsentChoice,
} from "../lib/cookieConsentStorage";

export type { CookieConsentChoice };

type CookieConsentContextValue = {
  choice: CookieConsentChoice;
  /** True when user chose "Accept all" — optional browser preference storage is allowed. */
  allowsPreferenceStorage: boolean;
  openCookiePreferences: () => void;
  closeCookiePreferences: () => void;
  preferenceCenterOpen: boolean;
  setChoiceAndPersist: (choice: "essential" | "all") => void;
  /** Removes stored consent so the first-visit banner appears again (optional prefs cleared). */
  resetConsentForBanner: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(
  undefined,
);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<CookieConsentChoice>(() => readConsent());
  const [preferenceCenterOpen, setPreferenceCenterOpen] = useState(false);

  const setChoiceAndPersist = useCallback((c: "essential" | "all") => {
    writeConsent(c);
    if (c === "essential") {
      clearOptionalPreferenceKeys();
    }
    setChoice(c);
    setPreferenceCenterOpen(false);
  }, []);

  const resetConsentForBanner = useCallback(() => {
    clearConsentStorage();
    clearOptionalPreferenceKeys();
    setChoice("unset");
    setPreferenceCenterOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      choice,
      allowsPreferenceStorage: choice === "all",
      openCookiePreferences: () => setPreferenceCenterOpen(true),
      closeCookiePreferences: () => setPreferenceCenterOpen(false),
      preferenceCenterOpen,
      setChoiceAndPersist,
      resetConsentForBanner,
    }),
    [choice, preferenceCenterOpen, setChoiceAndPersist, resetConsentForBanner],
  );

  return (
    <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return ctx;
}
