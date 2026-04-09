import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { PREF_KEY_ADMIN_SEARCH } from "../lib/cookieConsentStorage";
import { useCookieConsent } from "./CookieConsentContext";

type AdminSearchContextValue = {
  query: string;
  setQuery: (value: string) => void;
};

const AdminSearchContext = createContext<AdminSearchContextValue | undefined>(undefined);

export function AdminSearchProvider({ children }: { children: ReactNode }) {
  const { allowsPreferenceStorage } = useCookieConsent();
  const [query, setQueryState] = useState("");

  useEffect(() => {
    if (allowsPreferenceStorage) {
      const saved = localStorage.getItem(PREF_KEY_ADMIN_SEARCH);
      setQueryState(saved ?? "");
    } else {
      setQueryState("");
    }
  }, [allowsPreferenceStorage]);

  useEffect(() => {
    if (!allowsPreferenceStorage) {
      localStorage.removeItem(PREF_KEY_ADMIN_SEARCH);
      return;
    }
    if (query.trim()) {
      localStorage.setItem(PREF_KEY_ADMIN_SEARCH, query);
    } else {
      localStorage.removeItem(PREF_KEY_ADMIN_SEARCH);
    }
  }, [allowsPreferenceStorage, query]);

  const setQuery = (value: string) => setQueryState(value);

  return (
    <AdminSearchContext.Provider value={{ query, setQuery }}>
      {children}
    </AdminSearchContext.Provider>
  );
}

export function useAdminSearch() {
  const context = useContext(AdminSearchContext);
  if (!context) {
    throw new Error("useAdminSearch must be used within AdminSearchProvider");
  }
  return context;
}
