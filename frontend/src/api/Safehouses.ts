import { BASE_URL } from "../config/api";
import { fetchJson } from "../lib/fetchJson";
import type { Safehouse } from "../types/Safehouse";

/** Admin-only: same endpoint as the all-safehouses admin page. */
export const getSafehouses = async (): Promise<Safehouse[]> => {
  return fetchJson<Safehouse[]>(`${BASE_URL}/Safehouses`, {
    credentials: "include",
  });
};

