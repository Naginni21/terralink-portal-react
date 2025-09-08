import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AuthRedirect() {
  const navigate = useNavigate();
  const { validateSession } = useAuth();

  useEffect(() => {
    const handleRedirect = async () => {
      console.log('[AuthRedirect] Checking session...');
      
      // Check if we have a token
      const token = localStorage.getItem('sessionToken');
      
      if (token) {
        console.log('[AuthRedirect] Token found, validating...');
        
        // Force validation
        const isValid = await validateSession();
        
        if (isValid) {
          console.log('[AuthRedirect] Session valid, navigating to portal...');
          navigate('/', { replace: true });
        } else {
          console.log('[AuthRedirect] Session invalid, redirecting to signin...');
          navigate('/signin', { replace: true });
        }
      } else {
        console.log('[AuthRedirect] No token found, redirecting to signin...');
        navigate('/signin', { replace: true });
      }
    };

    handleRedirect();
  }, [navigate, validateSession]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Validando sesión...</p>
        <p className="mt-2 text-sm text-gray-500">Redirigiendo...</p>
      </div>
    </div>
  );
}