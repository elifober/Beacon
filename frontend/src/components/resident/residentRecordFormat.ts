/** Page size for resident record modals (Education, Health, etc.) */
export const RESIDENT_RECORD_MODAL_PAGE_SIZE = 10;

export function formatDate(dateStr: string | undefined | null): string {
  if (dateStr == null || dateStr === "") return "\u2014";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

export function dashIfEmpty(value: string | null | undefined): string {
  if (value == null || String(value).trim() === "") return "\u2014";
  return value;
}

export function fmtNum(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return "\u2014";
  return Number.isInteger(n) ? String(n) : n.toFixed(digits);
}

export function fmtBool(b: boolean | null | undefined): string {
  if (b == null) return "\u2014";
  return b ? "Yes" : "No";
}

export function clip(text: string | null | undefined, max = 120): string {
  if (text == null || text === "") return "\u2014";
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}\u2026`;
}

/** Insert spaces before capitals where words were concatenated (e.g. InProgress → In Progress). */
export function splitConcatenatedWords(value: string): string {
  const s = value.trim();
  if (!s) return s;
  return s
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
}

/** Completion / status fields that may arrive as PascalCase or camelCase without spaces. */
export function formatCompletionStatus(value: string | null | undefined): string {
  const d = dashIfEmpty(value);
  if (d === "\u2014") return d;
  return splitConcatenatedWords(d);
}

/** Strip repeated "Health status: " prefixes from notes (case-insensitive). */
export function stripHealthStatusPrefix(value: string | null | undefined): string {
  if (value == null || value === "") return "";
  return value.replace(/health\s*status:\s*/gi, "").trim();
}

/** Notes cell for health modal: strip prefix then clip; use full stripped text for title. */
export function formatHealthNotesCell(value: string | null | undefined): {
  display: string;
  title: string;
} {
  const stripped = stripHealthStatusPrefix(value);
  if (stripped === "") {
    return { display: "\u2014", title: "" };
  }
  const display = clip(stripped);
  return { display, title: stripped };
}
