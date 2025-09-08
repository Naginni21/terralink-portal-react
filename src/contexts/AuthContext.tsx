import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/index';

interface AuthContextType {
  user: User | null;
  csrfToken: string | null;
  isLoading: boolean;
  login: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate session with backend
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        setUser(null);
        setCsrfToken(null);
        return false;
      }

      const data = await response.json();
      
      if (data.authenticated && data.user) {
        setUser(data.user);
        setCsrfToken(data.csrfToken);
        return true;
      }

      setUser(null);
      setCsrfToken(null);
      return false;
    } catch (error) {
      console.error('[Auth] Session validation failed:', error);
      setUser(null);
      setCsrfToken(null);
      return false;
    }
  }, []);

  // Login with Google credential
  const login = useCallback(async (credential: string) => {
    try {
      const response = await fetch('/api/auth/google-signin', {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
        setCsrfToken(data.csrfToken);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('[Auth] Login failed:', error);
      throw error;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
      });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    } finally {
      // Clear state regardless of API response
      setUser(null);
      setCsrfToken(null);
    }
  }, [csrfToken]);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        await validateSession();
      } catch (error) {
        console.error('[Auth] Session check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [validateSession]);

  // Set up periodic validation (every 5 minutes when active)
  useEffect(() => {
    if (!user) return;

    const checkInterval = 5 * 60 * 1000; // 5 minutes
    
    const interval = setInterval(() => {
      // Only validate if tab is visible
      if (document.visibilityState === 'visible') {
        console.log('[Auth] Running periodic session validation...');
        validateSession();
      }
    }, checkInterval);

    // Also validate when tab becomes visible after being hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, validateSession]);

  const value: AuthContextType = {
    user,
    csrfToken,
    isLoading,
    login,
    logout,
    validateSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};