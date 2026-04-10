import { BASE_URL } from "../config/api";
import type { Resident } from "../types/Resident";
import type { ResidentList } from "../types/ResidentList";

export interface ResidentInput {
  caseControlNo: string;
  internalCode: string;
  safehouseId: number;
  caseStatus: string;
  sex: string;
  dateOfBirth: string;
  initialRiskLevel: string;
  currentRiskLevel: string;
}

function buildResidentJsonBody(resident: ResidentInput): Record<string, unknown> {
  const dob = resident.dateOfBirth?.trim();
  return {
    caseControlNo: resident.caseControlNo?.trim() || null,
    internalCode: resident.internalCode?.trim() || null,
    safehouseId: resident.safehouseId,
    caseStatus: resident.caseStatus?.trim() || null,
    sex: resident.sex?.trim() || null,
    dateOfBirth: dob ? dob.slice(0, 10) : null,
    initialRiskLevel: resident.initialRiskLevel?.trim() || null,
    currentRiskLevel: resident.currentRiskLevel?.trim() || null,
  };
}

function messageFromBeaconErrorPayload(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const o = payload as Record<string, unknown>;
  const detail = o.detail;
  if (typeof detail === "string" && detail.length > 0) return detail;
  const message = o.message;
  if (typeof message === "string" && message.length > 0) return message;
  const title = o.title;
  if (typeof title === "string" && title.length > 0) return title;
  const errors = o.errors;
  if (errors && typeof errors === "object") {
    for (const v of Object.values(errors as Record<string, unknown>)) {
      if (typeof v === "string" && v.length > 0) return v;
    }
  }
  return fallback;
}

export const getResidentList = async (): Promise<ResidentList[]> => {
  const response = await fetch(`${BASE_URL}/ResidentList`);
  return await response.json();
};


export async function getManagingResidents(): Promise<Resident[]> {
  const response = await fetch (`${BASE_URL}/admin/residents`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

export async function createResident(resident: ResidentInput): Promise<Resident> {
  const response = await fetch(`${BASE_URL}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(buildResidentJsonBody(resident)),
  });
  const raw = await response.text();
  let payload: unknown = null;
  if (raw.trim()) {
    try {
      payload = JSON.parse(raw) as unknown;
    } catch {
      payload = null;
    }
  }
  if (!response.ok) {
    const fallback = `Request failed (${response.status})`;
    throw new Error(messageFromBeaconErrorPayload(payload, fallback));
  }
  return payload as Resident;
}