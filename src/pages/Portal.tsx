import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Layout/Navbar';
import { ListView } from '../components/Portal/ListView';
import type { ViewMode, AccessLog, Application } from '../types/index';
import { APPLICATIONS_DATA } from '../lib/constants';
import { getApiUrl } from '../lib/api';
// auth-api removed - using cookie-based authentication now

export function Portal() {
  const { user, logout, csrfToken } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  const userRole = user?.role || 'usuario';

  const getAccessibleApps = (): Application[] => {
    return APPLICATIONS_DATA.filter(app => app.roles.includes(userRole));
  };

  const handleLogout = () => {
    if (user) {
      logAccess('logout', user.email);
    }
    logout();
    navigate('/signin');
  };

  const logAccess = useCallback((action: string, userEmail: string, appName: string | null = null) => {
    const newLog: AccessLog = {
      timestamp: new Date().toISOString(),
      user: userEmail,
      action: action,
      app: appName,
      id: Date.now()
    };
    
    setAccessLogs(prev => [newLog, ...prev].slice(0, 100));
  }, []);

  const handleAppClick = async (app: Application) => {
    if (user) {
      logAccess('app_access', user.email, app.name);
    }

    if (app.url) {
      try {
        const appUrl = new URL(app.url);
        const appHost = appUrl.hostname;
        const appDomain = import.meta.env.VITE_APP_DOMAIN || 'terralink.cl';

        // Determine if token exchange is needed
        let needsTokenExchange = false;

        if (appDomain === 'localhost') {
          // In local development, all localhost ports share cookies
          needsTokenExchange = appHost !== 'localhost';
        } else {
          // In production, check if it's a terralink.cl subdomain
          // Cookies with domain=.terralink.cl work for all *.terralink.cl subdomains
          needsTokenExchange = !appHost.endsWith('.terralink.cl') &&
                               appHost !== 'terralink.cl';
        }

        if (needsTokenExchange) {
          // Cross-domain app - need token exchange
          console.log(`Cross-domain app detected: ${appHost} (not under ${appDomain})`);

          // Request token from backend
          const response = await fetch(getApiUrl('/api/auth/app-token'), {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(csrfToken && { 'X-CSRF-Token': csrfToken })
            },
            body: JSON.stringify({
              appId: app.id,
              appDomain: appHost
            })
          });

          if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status}`);
          }

          const { token } = await response.json();

          // Open app with token in URL
          const separator = app.url.includes('?') ? '&' : '?';
          window.open(`${app.url}${separator}token=${encodeURIComponent(token)}`, '_blank');
        } else {
          // Same domain (terralink subdomain or localhost) - cookies will work
          console.log(`Same-domain app: ${appHost} (under ${appDomain})`);
          window.open(app.url, '_blank');
        }
      } catch (error) {
        console.error('Error launching app:', error);
        // Fallback to direct navigation
        window.open(app.url, '_blank');
      }
    } else {
      alert(`La aplicación "${app.name}" estará disponible próximamente`);
    }
  };

  const AdminPanel = () => {
    if (userRole !== 'admin') return null;
    
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <details className="bg-white rounded-lg shadow-lg border border-gray-200">
          <summary className="cursor-pointer p-3 font-medium text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg">
            Logs de Acceso (Admin)
          </summary>
          <div className="p-4 max-h-64 overflow-y-auto">
            <div className="space-y-2 text-xs">
              {accessLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="border-b border-gray-100 pb-2 last:border-0">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">{log.user}</span>
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-gray-600 mt-0.5">
                    <span className="font-medium">{log.action}</span> 
                    {log.app && <span className="ml-1">→ {log.app}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>
    );
  };

  useEffect(() => {
    // Log login on mount
    if (user) {
      logAccess('login', user.email);
    }
  }, [user, logAccess]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        user={user} 
        userRole={userRole} 
        viewMode={viewMode} 
        onViewModeChange={setViewMode}
        onLogout={handleLogout}
      />
      <ListView 
        applications={getAccessibleApps()} 
        userRole={userRole} 
        onAppClick={handleAppClick}
      />
      <AdminPanel />
    </div>
  );
}