import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Zap } from 'lucide-react';

export function UniversalSignIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(entry);
    setLogs(prev => [...prev, entry]);
  };

  useEffect(() => {
    // Check if we're returning from OAuth with a code
    const code = searchParams.get('code');
    if (code) {
      addLog('🔑 OAuth code detected in URL');
      handleOAuthCallback(code);
    }

    // Check if already authenticated
    const token = localStorage.getItem('sessionToken');
    if (token) {
      addLog('🔐 Existing session found');
      validateAndRedirect(token);
    }
  }, [searchParams]);

  const handleOAuthCallback = async (code: string) => {
    addLog('📤 Exchanging OAuth code for token...');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/google-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          redirect_uri: window.location.origin + window.location.pathname
        })
      });

      addLog(`📥 Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      
      if (data.sessionToken) {
        addLog('✅ Session token received');
        localStorage.setItem('sessionToken', data.sessionToken);
        
        // Force a full page reload to reinitialize the app
        addLog('🔄 Reloading to portal...');
        window.location.href = '/';
      } else {
        throw new Error('No session token in response');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      addLog(`❌ Error: ${errorMsg}`);
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  const validateAndRedirect = async (token: string) => {
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        addLog('✅ Session valid, redirecting...');
        navigate('/', { replace: true });
      } else {
        addLog('❌ Session invalid, clearing...');
        localStorage.removeItem('sessionToken');
      }
    } catch (err) {
      addLog(`❌ Validation error: ${err}`);
      localStorage.removeItem('sessionToken');
    }
  };

  const initiateGoogleLogin = () => {
    addLog('🚀 Starting Google OAuth...');
    
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google Client ID not configured');
      return;
    }

    // Build OAuth URL
    const redirectUri = encodeURIComponent(window.location.origin + '/universal-signin');
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
    
    addLog('🔗 Redirecting to Google...');
    window.location.href = authUrl;
  };

  const clearAll = () => {
    localStorage.clear();
    sessionStorage.clear();
    setError(null);
    setLogs([]);
    addLog('🧹 Cleared all data');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Portal TerraLink
            </h1>
            <p className="text-sm text-gray-500">
              Universal Sign In
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Processing authentication...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={initiateGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="font-medium text-gray-700">Sign in with Google</span>
              </button>

              <button
                onClick={clearAll}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear Session & Retry
              </button>
            </div>
          )}

          {/* Minimal debug info */}
          {logs.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Debug Logs ({logs.length})
                </summary>
                <div className="mt-2 p-2 bg-gray-50 rounded max-h-32 overflow-y-auto font-mono">
                  {logs.map((log, i) => (
                    <div key={i} className="text-gray-600">{log}</div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/signin-debug" 
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Having issues? Try debug mode →
          </a>
        </div>
      </div>
    </div>
  );
}