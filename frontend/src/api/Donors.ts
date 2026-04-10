import { requireApiBaseUrl } from "../lib/apiBaseUrl";
import type { DonorDashboard } from "../types/DonorDashboard";

/**
 * Donor API (supporter-facing).
 *
 * Architecture notes:
 * - Uses cookie-based sessions (`credentials: "include"`).
 * - The backend enforces that a donor can only access their own dashboard by ID
 *   (admins can access any donor for support/operations).
 */
export const getDonorDashboard = async (id: number): Promise<DonorDashboard> => {
  const url = new URL(`/Beacon/DonorDashboard/${id}`, requireApiBaseUrl()).toString();
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    // Make 401/403 readable instead of “Unexpected end of JSON input”
    throw new Error(response.status === 401 ? "Please sign in again." : `Failed to load dashboard (${response.status})`);
  }

  return (await response.json()) as DonorDashboard;
};
