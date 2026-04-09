function messageFromErrorBody(body: string): string {
  const t = body.trim();
  if (!t) return "";
  try {
    const j = JSON.parse(t) as Record<string, unknown>;
    const msg =
      (typeof j.detail === "string" && j.detail) ||
      (typeof j.title === "string" && j.title) ||
      (typeof j.message === "string" && j.message);
    if (msg) return msg;
  } catch {
    /* plain text */
  }
  return t.length > 200 ? `${t.slice(0, 200)}…` : t;
}

function httpError(status: number, body: string): Error {
  const detail = messageFromErrorBody(body);
  const withDetail = (base: string) =>
    detail ? `${base} ${detail}` : base;

  if (status === 401) {
    return new Error(withDetail("Sign in required."));
  }
  if (status === 403) {
    return new Error(
      withDetail(
        "Access denied (403). Sign in with an account that has permission (e.g. Admin)."
      )
    );
  }
  if (status === 404) {
    return new Error(withDetail("Not found."));
  }
  return new Error(withDetail(`Request failed (${status}).`));
}

/**
 * Parses JSON from a fetch response. Avoids calling `.json()` on error responses with an empty body
 * (common for ASP.NET 403/401), which throws "Unexpected end of JSON input".
 */
export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  const text = await res.text();
  if (!res.ok) {
    throw httpError(res.status, text);
  }
  if (!text.trim()) {
    throw new Error("Empty response from server.");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Invalid JSON from server.");
  }
}
