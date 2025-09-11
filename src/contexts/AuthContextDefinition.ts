import { createContext } from 'react';
import type { User } from '../types/index';

export interface AuthContextType {
  user: User | null;
  csrfToken: string | null;
  isLoading: boolean;
  /**
   * Direct login with credential - for programmatic use or testing.
   * Note: Primary authentication uses redirect mode via Google OAuth.
   */
  login: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);