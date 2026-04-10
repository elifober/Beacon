import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import BeaconLoadingMark from './BeaconLoadingMark.tsx';

/**
 * UI auth gate (client-side).
 *
 * Architecture notes:
 * - This is a UX feature: it routes anonymous users to `/login`.
 * - It is NOT a security boundary; backend endpoints still enforce `[Authorize]` + policies.
 * - We preserve the intended destination in `next=` so users return after sign-in.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <BeaconLoadingMark />
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <>{children}</>;
}

