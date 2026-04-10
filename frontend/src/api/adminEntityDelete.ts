import { BASE_URL } from "../config/api";
import {
  messageFromJsonPayload,
  readResponseJson,
} from "../components/resident/residentRecordFormUtils";

export type AdminDeletableEntity = "Resident" | "Safehouse" | "Partner" | "Donor";

/**
 * Admin-only delete (POST …/Delete matches other Beacon delete routes; also supports DELETE verb on the API).
 */
export async function deleteBeaconEntity(
  segment: AdminDeletableEntity,
  id: string | number,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/${segment}/${id}/Delete`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (res.ok) return;
  const { payload } = await readResponseJson(res);
  throw new Error(messageFromJsonPayload(payload, `Delete failed (${res.status})`));
}
