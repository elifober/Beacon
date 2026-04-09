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
  birthStatus: string;
  placeOfBirth: string;
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
  const response = await fetch (`${BASE_URL}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(resident),
    });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};