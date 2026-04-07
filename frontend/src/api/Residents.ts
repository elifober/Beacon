import { BASE_URL } from "../config/api";
import type { ResidentList } from "../types/ResidentList";

export const getResidentList = async (): Promise<ResidentList[]> => {
  const response = await fetch(`${BASE_URL}/ResidentList`);
  return await response.json();
};
