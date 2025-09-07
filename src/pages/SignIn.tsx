import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';

export function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('No se recibió credencial de Google');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await login(credentialResponse.credential);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = () => {
    setError('Error al conectar con Google. Por favor, intente nuevamente.');
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
                <span className="ml-3 text-gray-600 text-sm">Iniciando sesión...</span>
              </div>
            ) : (
              <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                <div className="flex justify-center w-full">
                  <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={handleError}
                    useOneTap
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                    logo_alignment="left"
                    width={320}
                  />
                </div>
              </GoogleOAuthProvider>
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