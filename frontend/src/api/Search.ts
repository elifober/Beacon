import { BASE_URL } from "../config/api";
import type { SearchResult } from "../types/SearchResult";
import type { Supporter } from "../types/Supporter";
import type { Partner } from "../types/Partner";
import type { Safehouse } from "../types/Safehouse";

export const search = async (q: string): Promise<SearchResult[]> => {
  const response = await fetch(`${BASE_URL}/Search?q=${encodeURIComponent(q)}`);
  return await response.json();
};

export const getDonor = async (id: number): Promise<Supporter> => {
  const response = await fetch(`${BASE_URL}/Donor/${id}`);
  return await response.json();
};

export const getPartner = async (id: number): Promise<Partner> => {
  const response = await fetch(`${BASE_URL}/Partner/${id}`);
  return await response.json();
};

export const getSafehouse = async (id: number): Promise<Safehouse> => {
  const response = await fetch(`${BASE_URL}/Safehouse/${id}`);
  return await response.json();
};
