import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            ux_mode?: string;
            login_uri?: string;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            state_cookie_domain?: string;
            login_hint?: string;
            hd?: string;
          }) => void;
          renderButton: (element: HTMLElement | null, options?: {
            type?: string;
            theme?: string;
            size?: string;
            text?: string;
            shape?: string;
            logo_alignment?: string;
            width?: number;
            locale?: string;
          }) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export function SignIn() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading] = useState(false);

  // Note: Using redirect mode, so no callback needed
  // The google-callback endpoint handles the authentication

  // Initialize Google Sign-In
  useEffect(() => {
    // Check if already authenticated
    if (user) {
      navigate('/', { replace: true });
      return;
    }

    // Check for error from callback
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        no_credential: 'No se recibió credencial de Google',
        invalid_credential: 'Credencial de Google inválida',
        invalid_payload: 'Datos de usuario inválidos',
        email_not_verified: 'El email no está verificado',
        domain_not_allowed: 'Dominio no autorizado',
        authentication_failed: 'Error en la autenticación'
      };
      setError(errorMessages[errorParam] || 'Error al iniciar sesión');
      // Clean up URL
      window.history.replaceState({}, document.title, '/signin');
    }

    const initializeGoogleSignIn = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
      
      if (!clientId) {
        setError('Google Client ID no configurado');
        return;
      }

      if (typeof window.google === 'undefined') {
        // Waiting for Google SDK
        setTimeout(initializeGoogleSignIn, 100);
        return;
      }

      // Initializing Google Sign-In with redirect
      
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: 'redirect',
          login_uri: window.location.origin + '/api/auth/google-callback'
        });

        // Render the Google Sign-In button
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          { 
            theme: 'outline',
            size: 'large',
            width: 300,
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          }
        );
      } catch {
        // Failed to initialize Google Sign-In
        setError('Error al inicializar Google Sign-In');
      }
    };

    // Wait for Google SDK to load
    initializeGoogleSignIn();
  }, [user, navigate]);

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
                  // Force re-render the Google button
                  window.location.reload();
                }}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-700 underline"
              >
                ¿Problemas para iniciar sesión? Click aquí para recargar
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