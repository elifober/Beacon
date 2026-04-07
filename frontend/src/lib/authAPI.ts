import type { AuthSession } from '../types/AuthSession';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';


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
    const response = await fetch(`${apiBaseUrl}/api/auth/me`,{
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch auth session');
    }
    return response.json();
}

export async function registerUser(
    email: string,
    password: string,
): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password}),
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Failed to register user')
        );
    }
}

export async function loginUser(email: string, password: string, rememberMe: boolean): Promise<void> {
    const searchParams = new URLSearchParams();
    searchParams.set("useCookies", "true");

    if (rememberMe) {
        searchParams.set('useSessionCookies', 'false');
    }
    else{
        searchParams.set('useSessionCookies', 'true');
    }

    const response = await fetch(`${apiBaseUrl}/api/auth/login?${searchParams.toString()}`, {
        method: 'POST',
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
    const response = await fetch(`${apiBaseUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Failed to logout user')
        );
    }
}
