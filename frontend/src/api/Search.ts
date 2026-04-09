import { BASE_URL } from "../config/api";
import { fetchJson } from "../lib/fetchJson";
import type { SearchResult } from "../types/SearchResult";
import type { Supporter } from "../types/Supporter";
import type { Partner } from "../types/Partner";
import type { Safehouse } from "../types/Safehouse";

export const search = async (q: string): Promise<SearchResult[]> => {
  return fetchJson<SearchResult[]>(
    `${BASE_URL}/Search?q=${encodeURIComponent(q)}`
  );
};

export const getDonor = async (id: number): Promise<Supporter> => {
  return fetchJson<Supporter>(`${BASE_URL}/Donor/${id}`, {
    credentials: "include",
  });
};

export const getPartner = async (id: number): Promise<Partner> => {
  return fetchJson<Partner>(`${BASE_URL}/Partner/${id}`, {
    credentials: "include",
  });
};

export const getSafehouse = async (id: number): Promise<Safehouse> => {
  return fetchJson<Safehouse>(`${BASE_URL}/Safehouse/${id}`, {
    credentials: "include",
  });
};
