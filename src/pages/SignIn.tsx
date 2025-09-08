import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Zap } from 'lucide-react';

export function SignIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if we're returning from OAuth with a code
    const code = searchParams.get('code');
    if (code) {
      handleOAuthCallback(code);
    }

    // Check if already authenticated
    const token = localStorage.getItem('sessionToken');
    if (token) {
      validateSessionAndRedirect(token);
    }
  }, [searchParams]);

  const handleOAuthCallback = async (code: string) => {
    console.log('[OAuth] Processing callback with code');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/google-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          redirect_uri: window.location.origin + '/signin'
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Authentication failed');
      }

      const data = await response.json();
      
      if (data.sessionToken) {
        console.log('[OAuth] Session established, redirecting...');
        localStorage.setItem('sessionToken', data.sessionToken);
        
        // Force full page reload to reinitialize app with auth
        window.location.href = '/';
      } else {
        throw new Error('No session token received');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      console.error('[OAuth] Callback error:', errorMsg);
      setError(errorMsg);
      setIsLoading(false);
      
      // Clear the URL params
      window.history.replaceState({}, document.title, '/signin');
    }
  };

  const validateSessionAndRedirect = async (token: string) => {
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        console.log('[OAuth] Valid session found, redirecting...');
        navigate('/', { replace: true });
      } else {
        console.log('[OAuth] Invalid session, clearing...');
        localStorage.removeItem('sessionToken');
      }
    } catch (err) {
      console.error('[OAuth] Validation error:', err);
      localStorage.removeItem('sessionToken');
    }
  };

  const initiateGoogleLogin = () => {
    console.log('[OAuth] Initiating Google login...');
    
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google Client ID not configured');
      return;
    }

    // Build OAuth URL for direct redirect
    const redirectUri = encodeURIComponent(window.location.origin + '/signin');
    const scope = encodeURIComponent('openid email profile');
    const responseType = 'code';
    const accessType = 'offline';
    const prompt = 'select_account';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=${responseType}&` +
      `scope=${scope}&` +
      `access_type=${accessType}&` +
      `prompt=${prompt}`;
    
    console.log('[OAuth] Redirecting to Google...');
    window.location.href = authUrl;
  };

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
                <span className="ml-3 text-gray-600 text-sm">Procesando autenticación...</span>
              </div>
            ) : (
              <button
                onClick={initiateGoogleLogin}
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

          {/* Debug Links */}
          <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
            <a href="/signin-debug" className="block text-center text-xs text-blue-600 hover:underline">
              Debug Mode →
            </a>
            <a href="/universal-signin" className="block text-center text-xs text-blue-600 hover:underline">
              Universal Sign In →
            </a>
            <a href="/oauth-minimal" className="block text-center text-xs text-blue-600 hover:underline">
              Minimal Test →
            </a>
          </div>

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
            © 2024 Terralink - Conexión segura con Google OAuth 2.0
          </p>
        </div>
      </div>
    </div>
  );
}