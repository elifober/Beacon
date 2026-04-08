import type { AuthSession } from "../types/AuthSession";

/**
 * Where to send the user after a successful sign-in (or when they land on "/" already authenticated).
 * Admin → admin dashboard; donor (Supporter) → donor dashboard when linked to a Supporter row.
 */
export function getPostLoginPath(session: AuthSession | null): string {
  if (!session?.isAuthenticated) return "/";

  const roles = session.roles ?? [];
  if (roles.includes("Admin")) {
    return "/admin";
  }

  const sid = session.supporterId;
  if (roles.includes("Supporter") && sid != null) {
    return `/donor-dashboard/${sid}`;
  }

  return "/";
}
