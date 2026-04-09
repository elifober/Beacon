const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();

/** API prefix for BeaconController. Relative `/Beacon` uses the SPA origin (e.g. Vite proxy). Set `VITE_API_BASE_URL` for split-host production (origin only, no trailing slash). */
export const BASE_URL =
  fromEnv && fromEnv.length > 0 ? `${fromEnv.replace(/\/+$/, "")}/Beacon` : "/Beacon";
