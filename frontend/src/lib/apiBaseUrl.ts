export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim();
export function requireApiBaseUrl(): string {
  if (!apiBaseUrl) {
    throw new Error('Missing VITE_API_BASE_URL (set it in Vercel and redeploy).');
  }
  return apiBaseUrl;
}