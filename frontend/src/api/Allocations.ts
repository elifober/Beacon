import { BASE_URL } from "../config/api";
import type { AllocationRow } from "../types/ProgramAllocation";

export const getAllocations = async (): Promise<AllocationRow[]> => {
  const response = await fetch(`${BASE_URL}/Allocations`);
  return await response.json();
};
