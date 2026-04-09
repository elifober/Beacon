export const requiredFieldMsg = "This field is required.";

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
