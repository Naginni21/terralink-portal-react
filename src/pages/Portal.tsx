import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Layout/Navbar';
import { ListView } from '../components/Portal/ListView';
import type { ViewMode, AccessLog, Application } from '../types/index';
import { APPLICATIONS_DATA } from '../lib/constants';
import { authApi } from '../lib/auth-api';

export function Portal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const userRole = user.role;

  const getAccessibleApps = (): Application[] => {
    return APPLICATIONS_DATA.filter(app => app.roles.includes(userRole));
  };

  const handleLogout = () => {
    logAccess('logout', user.email);
    logout();
    navigate('/signin');
  };

  const logAccess = (action: string, userEmail: string, appName: string | null = null) => {
    const newLog: AccessLog = {
      timestamp: new Date().toISOString(),
      user: userEmail,
      action: action,
      app: appName,
      id: Date.now()
    };
    
    setAccessLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const handleAppClick = async (app: Application) => {
    logAccess('app_access', user.email, app.name);
    
    if (app.url) {
      try {
        // Get session token
        const sessionToken = localStorage.getItem('sessionToken');
        if (!sessionToken) {
          alert('Session expired. Please login again.');
          navigate('/signin');
          return;
        }

        // Get app token from API
        const response = await authApi.getAppToken(sessionToken, app.id);
        
        if (response.appToken) {
          // Create URL with token
          const appUrl = new URL(app.url);
          appUrl.searchParams.set('token', response.appToken);
          
          // Open app with token
          window.open(appUrl.toString(), '_blank');
        } else {
          alert('Failed to generate app access token');
        }
      } catch (error) {
        console.error('Error generating app token:', error);
        alert('Error accessing application. Please try again.');
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
    logAccess('login', user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.email]);

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