import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, lastValidated, validateSession } = useAuth();

  useEffect(() => {
    // Check if validation is needed (more than 30 minutes since last check)
    if (user && lastValidated) {
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      if (lastValidated < thirtyMinutesAgo) {
        validateSession();
      }
    }
  }, [user, lastValidated, validateSession]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando sesión...</p>
          <p className="mt-2 text-sm text-gray-500">Esto puede tomar unos segundos...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}