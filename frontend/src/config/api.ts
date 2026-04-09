/** Use VITE_API_BASE_URL when the SPA is not served with a /Beacon proxy (see frontend/.env.example). */
const apiOrigin = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
export const BASE_URL = apiOrigin ? `${apiOrigin}/Beacon` : "/Beacon";