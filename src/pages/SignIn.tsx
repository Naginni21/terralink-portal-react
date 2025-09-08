import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import type { CodeResponse } from '@react-oauth/google';
import { Zap } from 'lucide-react';

export function SignIn() {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Use authorization code flow for better security
  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse: CodeResponse) => {
      console.log('[OAuth Success] Received auth code:', codeResponse.code ? 'yes' : 'no');
      setIsLoading(true);
      setError(null);

      try {
        // Send authorization code to backend
        const response = await fetch('/api/auth/google-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: codeResponse.code,
            redirect_uri: window.location.origin + '/signin'
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Authentication failed');
        }

        const data = await response.json();
        console.log('[OAuth] Backend response:', data);
        
        if (data.sessionToken) {
          // Store session
          localStorage.setItem('sessionToken', data.sessionToken);
          console.log('[OAuth] Session token stored, redirecting...');
          
          // Redirect to auth-redirect page which will handle validation
          window.location.replace('/auth-redirect');
        } else {
          throw new Error('No session token received from backend');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
      } finally {
        setIsLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error('[OAuth Error] Google login failed:', errorResponse);
      setError('Error al conectar con Google. Por favor, intente nuevamente.');
    },
    scope: 'openid email profile'
  });


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
              {error}
            </div>
          )}

          {/* Login Button */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 text-sm">Iniciando sesión...</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  console.log('[OAuth] Starting Google login...');
                  googleLogin();
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium">Iniciar sesión con Google</span>
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400">
              Solo correos @terralink.cl tienen acceso
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            © 2024 Terralink - Conexión segura con Google OAuth 2.0
          </p>
        </div>
      </div>
    </div>
  );
}