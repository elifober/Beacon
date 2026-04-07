import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {getAuthSession} from '../lib/authAPI';
import type { AuthSession } from '../types/AuthSession';

interface AuthContextValue{
    authSession: AuthSession | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    refreshAuthSession:() => Promise<void>;
}

const anonymousAuthSession: AuthSession = {
    isAuthenticated: false,
    userName: null,
    email: null,
    roles: [],
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authSession, setAuthSession] = useState<AuthSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshAuthSession = useCallback(async () => {
        try {
            const session = await getAuthSession();
            setAuthSession(session);
        } catch {
            setAuthSession(anonymousAuthSession);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshAuthSession();
    }, [refreshAuthSession]);

    return (
        <AuthContext.Provider value={{ authSession, isAuthenticated : authSession?.isAuthenticated ?? false, isLoading, refreshAuthSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};