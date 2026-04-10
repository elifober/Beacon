import { BASE_URL } from "../../config/api";

export const requiredFieldMsg = "This field is required.";

/** HTML date input value (yyyy-MM-dd) from API date strings. */
export function dateForDateInput(value: string | undefined | null): string {
  if (value == null || value === "") return "";
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Text field initial value for optional decimals from API. */
export function decimalFieldString(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  return String(n);
}

export function normalizeEnrollmentForForm(raw: string | undefined | null): "" | "Enrolled" | "Not Enrolled" {
  const s = (raw ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  if (s === "enrolled") return "Enrolled";
  if (s === "not enrolled" || s.replace(/\s/g, "") === "notenrolled") return "Not Enrolled";
  return "";
}

export function normalizeCompletionForForm(raw: string | undefined | null): "" | "NotStarted" | "InProgress" {
  const t = (raw ?? "").replace(/\s+/g, "").toLowerCase();
  if (t === "notstarted") return "NotStarted";
  if (t === "inprogress") return "InProgress";
  return "";
}

export function mergePicklistOption(options: string[], value: string | undefined | null): string[] {
  const v = (value ?? "").trim();
  if (!v) return options;
  if (options.some((o) => o === v)) return options;
  return [...options, v].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export function messageFromJsonPayload(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    const detail = o.detail;
    if (typeof detail === "string" && detail.length > 0) return detail;
    const message = o.message;
    if (typeof message === "string" && message.length > 0) return message;
    const title = o.title;
    if (typeof title === "string" && title.length > 0) return title;
  }
  return fallback;
}

export async function readResponseJson(res: Response): Promise<{ payload: unknown; raw: string }> {
  const raw = await res.text();
  let payload: unknown = null;
  if (raw.trim()) {
    try {
      payload = JSON.parse(raw) as unknown;
    } catch {
      payload = null;
    }
  }
  return { payload, raw };
}

/** POST JSON (e.g. resident record updates use POST …/Update so hosts that mishandle PUT still work). */
export function postBeaconJson(pathUnderBeacon: string, body: unknown): Promise<Response> {
  const path = pathUnderBeacon.startsWith("/") ? pathUnderBeacon : `/${pathUnderBeacon}`;
  return fetch(`${BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
}

export function putBeaconJson(pathUnderBeacon: string, body: unknown): Promise<Response> {
  const path = pathUnderBeacon.startsWith("/") ? pathUnderBeacon : `/${pathUnderBeacon}`;
  return fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
}

export function validateResidentIdInput(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return requiredFieldMsg;
  const n = Number(t);
  if (!Number.isInteger(n) || n <= 0) return "Enter a valid positive whole number.";
  return undefined;
}

function normalizeErrorKey(rawKey: string): string {
  if (rawKey.includes("_")) return rawKey.toLowerCase();
  let key = rawKey.length ? rawKey[0].toLowerCase() + rawKey.slice(1) : rawKey;
  key = key.replace(/([A-Z])/g, "_$1").toLowerCase();
  if (key.startsWith("_")) key = key.slice(1);
  return key;
}

export function parseServerErrors<T extends string>(
  validKeys: readonly T[],
  payload: unknown,
): Partial<Record<T, string>> {
  if (!payload || typeof payload !== "object") return {};
  const errors = (payload as { errors?: Record<string, string> }).errors;
  if (!errors || typeof errors !== "object") return {};
  const allowed = new Set<string>(validKeys);
  const out: Partial<Record<T, string>> = {};
  for (const [rawKey, v] of Object.entries(errors)) {
    if (typeof v !== "string") continue;
    const key = normalizeErrorKey(rawKey);
    if (allowed.has(key)) out[key as T] = v;
  }
  return out;
}

export function optionalDecimal(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function optionalInt(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isInteger(n)) return null;
  return n;
}

/** "" | "true" | "false" → null | boolean for JSON */
export function triStateToBool(
  v: string,
): boolean | null {
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** Read a string array from picklist API JSON (snake_case or camelCase). */
export function picklistStrings(payload: unknown, key: string): string[] {
  if (!payload || typeof payload !== "object") return [];
  const o = payload as Record<string, unknown>;
  const v = o[key] ?? o[snakeToCamelKey(key)];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
