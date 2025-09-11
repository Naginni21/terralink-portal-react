import { useState, useEffect } from 'react';

export interface PortalUser {
  email: string;
  name?: string;
  picture?: string;
  role?: string;
  domain?: string;
}

/**
 * Hook to access portal user in sub-apps
 */
export function usePortalUser(): PortalUser | null {
  const [user, setUser] = useState<PortalUser | null>(null);

  useEffect(() => {
    const storedSession = sessionStorage.getItem('portal_session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        setUser(session.user);
      } catch {
        setUser(null);
      }
    }
  }, []);

  return user;
}