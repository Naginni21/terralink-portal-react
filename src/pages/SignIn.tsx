import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

declare global {
  interface Window {
    google: any;
  }
}

export function SignIn() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle Google Sign-In response
  const handleCredentialResponse = useCallback(async (response: any) => {
    console.log('[Auth] Received Google credential');
    setIsLoading(true);
    setError(null);

    try {
      await login(response.credential);
      console.log('[Auth] Login successful, redirecting...');
      navigate('/', { replace: true });
    } catch (err) {
      console.error('[Auth] Login failed:', err);
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
      setIsLoading(false);
    }
  }, [login, navigate]);

  // Initialize Google Sign-In
  useEffect(() => {
    // Check if already authenticated
    if (user) {
      navigate('/', { replace: true });
      return;
    }

    const initializeGoogleSignIn = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        setError('Google Client ID no configurado');
        return;
      }

      if (typeof window.google === 'undefined') {
        console.log('[Auth] Waiting for Google SDK...');
        setTimeout(initializeGoogleSignIn, 100);
        return;
      }

      console.log('[Auth] Initializing Google Sign-In');
      
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render the Google Sign-In button
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          { 
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          }
        );

        // Optional: Show One Tap prompt
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('[Auth] One Tap not displayed:', notification.getNotDisplayedReason());
          }
        });
      } catch (err) {
        console.error('[Auth] Failed to initialize Google Sign-In:', err);
        setError('Error al inicializar Google Sign-In');
      }
    };

    // Wait for Google SDK to load
    initializeGoogleSignIn();
  }, [user, navigate, handleCredentialResponse]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Terralink Portal
            </h1>
            <p className="text-sm text-gray-500">
              Sistema Interno de Aplicaciones
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
              <div className="font-semibold">Error:</div>
              {error}
            </div>
          )}

          {/* Google Sign-In Button Container */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 text-sm">Iniciando sesión...</span>
              </div>
            ) : (
              <div id="googleSignInButton" className="w-full"></div>
            )}
          </div>

          {/* Manual Sign-In Fallback */}
          {!isLoading && (
            <div className="mt-4">
              <button
                onClick={() => {
                  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                  if (!clientId) {
                    setError('Google Client ID no configurado');
                    return;
                  }
                  // Fallback to traditional OAuth flow if needed
                  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                    `client_id=${clientId}&` +
                    `redirect_uri=${encodeURIComponent(window.location.origin + '/signin')}&` +
                    `response_type=token&` +
                    `scope=${encodeURIComponent('openid email profile')}&` +
                    `prompt=select_account`;
                  window.location.href = authUrl;
                }}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-700 underline"
              >
                ¿Problemas para iniciar sesión? Click aquí
              </button>
            </div>
          )}

          {/* Debug Links */}
          {import.meta.env.DEV && (
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
              <a href="/oauth-info" className="block text-center text-xs text-green-600 hover:underline">
                OAuth Configuration Info
              </a>
              <a href="/auth-test" className="block text-center text-xs text-red-600 hover:underline">
                Run Authentication Tests
              </a>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400">
              Solo correos @terralink.cl tienen acceso
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            © 2024 Terralink - Autenticación segura con Google
          </p>
        </div>
      </div>
    </div>
  );
}