import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types/index';
import { authApi, getStoredSessionToken, storeSessionToken, clearSession } from '../lib/auth-api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isValidating: boolean;
  lastValidated: number | null;
  login: (credential: string) => Promise<void>;
  logout: () => void;
  validateSession: () => Promise<boolean>;
  getSessionToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<number | null>(null);

  // Validate session with API
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (isValidating) return true;
    setIsValidating(true);

    try {
      const sessionToken = getStoredSessionToken();
      
      if (!sessionToken) {
        setUser(null);
        return false;
      }

      // Validate with API
      const response = await authApi.validateSession(sessionToken);
      
      if (!response.valid) {
        // Session invalid or expired
        clearSession();
        setUser(null);
        return false;
      }

      // Update user state
      if (response.user) {
        setUser(response.user);
        setLastValidated(Date.now());
      }

      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      clearSession();
      setUser(null);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [isValidating]);

  // Login function - uses API
  const login = async (googleCredential: string) => {
    try {
      // Send Google token to API for validation and session creation
      const response = await authApi.login(googleCredential);
      
      // Store session token
      storeSessionToken(response.sessionToken);
      
      // Update state
      setUser(response.user);
      setLastValidated(Date.now());
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Logout function
  const logout = useCallback(() => {
    // Clear session
    clearSession();
    
    // Clear state
    setUser(null);
    setLastValidated(null);
  }, []);

  // Get session token (for API calls)
  const getSessionToken = useCallback(() => {
    return getStoredSessionToken();
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionToken = getStoredSessionToken();
        
        if (sessionToken) {
          // Validate existing session
          await validateSession();
        }
      } catch (error) {
        console.error('Session check failed:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []); // Empty deps - only run on mount

  // Set up periodic validation (every 5 minutes when active)
  useEffect(() => {
    if (!user) return;

    const checkInterval = 5 * 60 * 1000; // 5 minutes
    
    const interval = setInterval(() => {
      // Only validate if tab is visible
      if (document.visibilityState === 'visible') {
        console.log('Running periodic session validation...');
        validateSession();
      }
    }, checkInterval);

    // Also validate when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastValidation = Date.now() - (lastValidated || 0);
        if (timeSinceLastValidation > checkInterval) {
          validateSession();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, lastValidated, validateSession]);

  const value: AuthContextType = {
    user,
    isLoading,
    isValidating,
    lastValidated,
    login,
    logout,
    validateSession,
    getSessionToken
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