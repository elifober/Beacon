/**
 * Returns pathname for in-app navigation only (blocks open redirects).
 */
export function parseSafeInternalPath(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return null;
  }

  if (trimmed.includes('://') || trimmed.includes('\\')) {
    return null;
  }

  return trimmed;
}

/**
 * Reads `next` from a URLSearchParams (e.g. login redirect).
 */
export function getSafeNextFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  return parseSafeInternalPath(params.get('next'));
}
