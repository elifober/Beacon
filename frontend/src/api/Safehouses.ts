import { BASE_URL } from "../config/api"
import type { Safehouse } from "../types/Safehouse"

//return all safehouses
export const getSafehouses = async (): Promise<Safehouse[]> => {
    const response = await fetch(`${BASE_URL}/AllSafehouses`)
    return await response.json()
}

