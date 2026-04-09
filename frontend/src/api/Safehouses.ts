import { requireApiBaseUrl } from "../lib/apiBaseUrl"
import type { Safehouse } from "../types/Safehouse"

//return all safehouses
export const getSafehouses = async (): Promise<Safehouse[]> => {
    const response = await fetch(new URL(`/AllSafehouses`, requireApiBaseUrl()).toString(), { credentials: "include" })
    return await response.json()
}

