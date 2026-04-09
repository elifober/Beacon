import { BASE_URL } from "../config/api";
import { fetchJson } from "../lib/fetchJson";
import type { Resident } from "../types/Resident";
import type { ResidentList } from "../types/ResidentList";

export interface ResidentInput {
  caseControlNo: string;
  internalCode: string;
  safehouseId: number;
  caseStatus: string;
  sex: string;
  dateOfBirth: string;
  birthStatus: string;
  placeOfBirth: string;
}

export const getResidentList = async (): Promise<ResidentList[]> => {
  return fetchJson<ResidentList[]>(`${BASE_URL}/Residents`, {
    credentials: "include",
  });
};

export async function getManagingResidents(): Promise<Resident[]> {
  return fetchJson<Resident[]>(`${BASE_URL}/admin/residents`, {
    credentials: "include",
  });
}

export async function createResident(resident: ResidentInput): Promise<Resident> {
  return fetchJson<Resident>(`${BASE_URL}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(resident),
  });
}