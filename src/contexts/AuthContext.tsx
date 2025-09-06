import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, GoogleUser } from '../types/index';
import { USER_DATABASE } from '../lib/constants';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  googleUser: GoogleUser | null;
  isLoading: boolean;
  isValidating: boolean;
  lastValidated: number | null;
  login: (credential: string) => Promise<void>;
  logout: () => void;
  validateSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<number | null>(null);

  // Secure storage helpers
  const storage = {
    setItem: (key: string, value: string) => {
      try {
        // Simple obfuscation (not true encryption but better than plain text)
        const encoded = btoa(encodeURIComponent(value));
        localStorage.setItem(key, encoded);
      } catch (error) {
        console.error('Storage error:', error);
      }
    },
    getItem: (key: string): string | null => {
      try {
        const encoded = localStorage.getItem(key);
        if (!encoded) return null;
        return decodeURIComponent(atob(encoded));
      } catch (error) {
        console.error('Storage error:', error);
        return null;
      }
    },
    removeItem: (key: string) => {
      localStorage.removeItem(key);
    }
  };

  // Validate session with Google
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (isValidating) return true;
    setIsValidating(true);

    try {
      const storedToken = storage.getItem('google_id_token');
      const storedUser = storage.getItem('user_data');

      if (!storedToken || !storedUser) {
        setUser(null);
        return false;
      }

      // Decode and check token expiry
      const decoded: any = jwtDecode(storedToken);
      const isExpired = decoded.exp * 1000 < Date.now();

      if (isExpired) {
        // Token expired - need to re-authenticate
        // In production, you'd use refresh token here
        console.log('Token expired, need to re-authenticate');
        logout();
        return false;
      }

      // Token still valid - update last validated time
      const userData = JSON.parse(storedUser);
      
      // Verify email domain is still @terralink.cl
      if (!userData.email.endsWith('@terralink.cl')) {
        logout();
        return false;
      }

      setLastValidated(Date.now());
      storage.setItem('last_validated', Date.now().toString());

      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      logout();
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [isValidating]);

  // Login function
  const login = async (credential: string) => {
    try {
      // Decode the JWT credential from Google
      const decoded: any = jwtDecode(credential);
      
      // Extract user info
      const googleUserData: GoogleUser = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        verified_email: decoded.email_verified
      };

      // Validate @terralink.cl domain
      if (!googleUserData.email.endsWith('@terralink.cl')) {
        throw new Error('Solo se permiten correos @terralink.cl');
      }

      // Get user role from database
      const userRole = USER_DATABASE[googleUserData.email]?.role || 'usuario';
      const userName = USER_DATABASE[googleUserData.email]?.name || googleUserData.name;

      // Create user object
      const userData: User = {
        id: googleUserData.id,
        email: googleUserData.email,
        name: userName,
        image: googleUserData.picture,
        role: userRole
      };

      // Store in secure storage
      storage.setItem('google_id_token', credential);
      storage.setItem('user_data', JSON.stringify(userData));
      storage.setItem('google_user', JSON.stringify(googleUserData));
      storage.setItem('last_validated', Date.now().toString());

      // Update state
      setUser(userData);
      setGoogleUser(googleUserData);
      setLastValidated(Date.now());
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Logout function
  const logout = useCallback(() => {
    // Clear storage
    storage.removeItem('google_id_token');
    storage.removeItem('user_data');
    storage.removeItem('google_user');
    storage.removeItem('last_validated');

    // Clear state
    setUser(null);
    setGoogleUser(null);
    setLastValidated(null);
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = storage.getItem('user_data');
        const storedGoogleUser = storage.getItem('google_user');
        const storedLastValidated = storage.getItem('last_validated');

        if (storedUser && storedGoogleUser) {
          const userData = JSON.parse(storedUser);
          const googleUserData = JSON.parse(storedGoogleUser);
          
          setUser(userData);
          setGoogleUser(googleUserData);
          setLastValidated(storedLastValidated ? parseInt(storedLastValidated) : null);

          // Validate session
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
  }, []);

  // Set up periodic validation (every 30 minutes)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      console.log('Running periodic session validation...');
      validateSession();
    }, parseInt(import.meta.env.VITE_VALIDATION_INTERVAL || '1800000')); // 30 minutes

    return () => clearInterval(interval);
  }, [user, validateSession]);

  const value: AuthContextType = {
    user,
    googleUser,
    isLoading,
    isValidating,
    lastValidated,
    login,
    logout,
    validateSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}