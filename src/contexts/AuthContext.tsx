import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/index';
import { AuthContext, type AuthContextType } from './AuthContextDefinition';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get token from localStorage
  const getToken = () => localStorage.getItem('auth_token');
  const setToken = (token: string) => localStorage.setItem('auth_token', token);
  const clearToken = () => localStorage.removeItem('auth_token');

  // Validate session with backend
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const token = getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add token to Authorization header if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include', // Include cookies (fallback)
        headers,
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
    } catch {
      // Session validation error
      setUser(null);
      setCsrfToken(null);
      return false;
    }
  }, []);

  // Login with Google credential
  const login = useCallback(async (credential: string) => {
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
    } catch {
      // Logout error - continue with cleanup
    } finally {
      // Clear state and token regardless of API response
      setUser(null);
      setCsrfToken(null);
      clearToken();
    }
  }, [csrfToken]);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if there's a token in the URL (from OAuth callback)
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');

        if (tokenFromUrl) {
          // Store the token
          setToken(tokenFromUrl);
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        await validateSession();
      } catch {
        // Session check error
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

// Hook moved to separate file - import from src/hooks/useAuth