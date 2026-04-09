import { requireApiBaseUrl } from "../lib/apiBaseUrl";

export const BASE_URL = new URL('/Beacon', requireApiBaseUrl()).toString()