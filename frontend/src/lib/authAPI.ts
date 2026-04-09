import type { AuthSession } from '../types/AuthSession';
import { requireApiBaseUrl } from '../lib/apiBaseUrl';

export type ExternalAuthProvider = {
    name: string;
    displayName: string;
};


async function readApiError(
    response: Response,
    fallbackMessage: string
  ): Promise<string> {
    const contentType = response.headers.get('content-type') ?? '';
  
    if (!contentType.includes('application/json')) {
      return fallbackMessage;
    }
  
    const data = await response.json();
  
    if (typeof data?.detail === 'string' && data.detail.length > 0) {
      return data.detail;
    }
  
    if (typeof data?.title === 'string' && data.title.length > 0) {
      return data.title;
    }
  
    if (data?.errors && typeof data.errors === 'object') {
      const firstError = Object.values(data.errors)
      .flat()
      .find((value): value is string => typeof value === 'string');

    if (firstError) {
      return firstError;
    }
  }

  if (typeof data?.message === 'string' && data.message.length > 0) {
    return data.message;
  }

  return fallbackMessage;
}


export async function getAuthSession(): Promise<AuthSession> {
    const response = await fetch(new URL(`/api/auth/me`, requireApiBaseUrl()).toString(), {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch auth session');
    }
    const data = await response.json();
    return {
        ...data,
        needsProfileCompletion: Boolean(data?.needsProfileCompletion),
    } as AuthSession;
}

export type CompleteProfilePayload = {
    firstName: string;
    lastName: string;
    organizationName: string | null;
    phone: string | null;
};

export async function completeDonorProfile(
    payload: CompleteProfilePayload
): Promise<void> {
    const response = await fetch(new URL(`/api/auth/complete-profile`, requireApiBaseUrl()).toString(), {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            firstName: payload.firstName,
            lastName: payload.lastName,
            organizationName: payload.organizationName?.trim() || null,
            phone: payload.phone?.trim() || null,
        }),
    });
    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Failed to save profile')
        );
    }
}

export async function getExternalAuthProviders(): Promise<ExternalAuthProvider[]> {
    const response = await fetch(new URL(`/api/auth/providers`, requireApiBaseUrl()).toString(), {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Failed to fetch external auth providers')
        );
    }

    const data = await response.json();
    return Array.isArray(data) ? (data as ExternalAuthProvider[]) : [];
}

export function buildExternalLoginUrl(provider: string, returnPath: string = '/'): string {
    const url = new URL(`/api/auth/external-login`, requireApiBaseUrl());
    url.searchParams.set('provider', provider);
    url.searchParams.set('returnPath', returnPath);
    return url.toString();
}

export async function registerUser(
    email: string,
    password: string,
): Promise<void> {
    const response = await fetch(new URL(`/api/auth/register`, requireApiBaseUrl()).toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Failed to register user')
        );
    }
}

export type RegisterWithProfilePayload = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string | null;
    phone: string | null;
};

/** Creates Identity user + supporter profile; signs you in with cookies. */
export async function registerUserWithProfile(
    payload: RegisterWithProfilePayload
): Promise<void> {
    const response = await fetch(new URL(`/api/auth/register-with-profile`, requireApiBaseUrl()).toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            email: payload.email,
            password: payload.password,
            firstName: payload.firstName,
            lastName: payload.lastName,
            organizationName: payload.organizationName?.trim() || null,
            phone: payload.phone?.trim() || null,
        }),
    });
    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Failed to register')
        );
    }
}

export async function loginUser(email: string, password: string, rememberMe: boolean): Promise<void> {
    const searchParams = new URLSearchParams();
    searchParams.set("useCookies", "true");

    if (rememberMe) {
        searchParams.set('useSessionCookies', 'false');
    }
    else {
        searchParams.set('useSessionCookies', 'true');
    }

    const response = await fetch(new URL(`/api/auth/login?${searchParams.toString()}`, requireApiBaseUrl()).toString(), {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Failed to login user')
        );
    }
}

export async function logoutUser(): Promise<void> {
    const response = await fetch(new URL(`/api/auth/logout`, requireApiBaseUrl()).toString(), {
        method: 'POST',
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Failed to logout user')
        );
    }
}

/** Admin-only: grant Partner or Admin to an existing user (for testing or ops). */
export async function assignRoleAsAdmin(
    email: string,
    role: 'Admin' | 'Partner'
): Promise<void> {
    const response = await fetch(new URL(`/api/auth/admin/assign-role`, requireApiBaseUrl()).toString(), {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
    });
    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Failed to assign role')
        );
    }
}
