import { BASE_URL } from "../config/api";
import { fetchJson } from "../lib/fetchJson";
import type { DonorDashboard } from "../types/DonorDashboard";

export const getDonorDashboard = async (id: number): Promise<DonorDashboard> => {
  return fetchJson<DonorDashboard>(`${BASE_URL}/DonorDashboard/${id}`, {
    credentials: "include",
  });
};
