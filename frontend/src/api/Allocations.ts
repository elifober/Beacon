import { BASE_URL } from "../config/api";
import { fetchJson } from "../lib/fetchJson";
import type { AllocationRow } from "../types/ProgramAllocation";

export const getAllocations = async (): Promise<AllocationRow[]> => {
  return fetchJson<AllocationRow[]>(`${BASE_URL}/Allocations`);
};
