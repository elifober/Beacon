import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type AdminSearchContextValue = {
  query: string;
  setQuery: (value: string) => void;
};

const AdminSearchContext = createContext<AdminSearchContextValue | undefined>(undefined);

export function AdminSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");

  return (
    <AdminSearchContext.Provider value={{ query, setQuery }}>
      {children}
    </AdminSearchContext.Provider>
  );
}

export function useAdminSearch() {
  const context = useContext(AdminSearchContext);
  if (!context) {
    throw new Error("useAdminSearch must be used within an AdminSearchProvider");
  }
  return context;
}
