import { useEffect, useState } from 'react';
// Note: auth-api has been replaced with cookie-based authentication
// This component needs to be updated for the new architecture

/**
 * PortalGuard Component - Smart Validation
 * 
 * Protects sub-apps by ensuring they can only be accessed through the portal.
 * Implements smart validation: initial token check + periodic session checks.
 * 
 * Usage in sub-app:
 * ```tsx
 * function App() {
 *   return (
 *     <PortalGuard portalUrl="https://apps.terralink.cl">
 *       <YourAppContent />
 *     </PortalGuard>
 *   );
 * }
 * ```
 */

interface PortalGuardProps {
  children: React.ReactNode;
  portalUrl?: string;
  checkInterval?: number; // In milliseconds, default 10 minutes
}

interface PortalUser {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string;
}

export function PortalGuard({ 
  children, 
  portalUrl = 'https://apps.terralink.cl',
  checkInterval = 10 * 60 * 1000 // 10 minutes
}: PortalGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<PortalUser | null>(null);

  // Initial validation on mount
  useEffect(() => {
    const validateAccess = async () => {
      // Check for token in URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      // Check for existing session in sessionStorage
      const storedSession = sessionStorage.getItem('portal_session');
      
      if (!token && !storedSession) {
        // No token and no session - redirect to portal
        redirectToPortal();
        return;
      }

      if (token) {
        // Validate new token with API
        try {
          // TODO: Update for new cookie-based auth architecture
          // For now, skip token validation
          const response = { valid: false, user: null };
          
          if (response.valid && response.user) {
            // Store session
            const session = {
              user: response.user,
              validatedAt: Date.now()
            };
            sessionStorage.setItem('portal_session', JSON.stringify(session));
            
            setUser(response.user);
            setIsAuthenticated(true);
            
            // Clean URL - remove token
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('token');
            window.history.replaceState({}, '', cleanUrl.toString());
          } else {
            // Invalid token - redirect to portal
            redirectToPortal();
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          redirectToPortal();
        }
      } else if (storedSession) {
        // Use existing session
        try {
          const session = JSON.parse(storedSession);
          setUser(session.user);
          setIsAuthenticated(true);
        } catch {
          redirectToPortal();
        }
      }
      
      setIsLoading(false);
    };

    validateAccess();
  }, []);

  // Periodic session check (every 10 minutes by default)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = setInterval(async () => {
      // Only check if tab is visible
      if (document.visibilityState === 'visible') {
        try {
          // TODO: Update for new cookie-based auth architecture
          // For now, skip session check
          const response = { valid: true };
          
          if (!response.valid) {
            // Session revoked - clear and redirect
            sessionStorage.removeItem('portal_session');
            alert('Your session has been revoked. Redirecting to portal...');
            redirectToPortal();
          }
        } catch (error) {
          console.error('Session check failed:', error);
          // Don't redirect on network errors - allow offline work
        }
      }
    }, checkInterval);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, checkInterval]);

  // Redirect to portal
  const redirectToPortal = () => {
    window.location.href = portalUrl;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando acceso desde el portal...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-6">
            Esta aplicación solo puede ser accedida a través del Portal Terralink.
          </p>
          <button
            onClick={redirectToPortal}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir al Portal
          </button>
        </div>
      </div>
    );
  }

  // Authenticated - render children with user context
  return (
    <div 
      data-portal-user={user?.email} 
      data-portal-role={user?.role}
      className="min-h-screen"
    >
      {/* Optional: Add a user indicator */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-md px-3 py-2 text-xs text-gray-600 z-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Portal: {user?.email}</span>
        </div>
      </div>
      
      {children}
    </div>
  );
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