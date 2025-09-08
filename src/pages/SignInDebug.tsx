import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import type { CodeResponse } from '@react-oauth/google';
import { Zap } from 'lucide-react';

export function SignInDebug() {
  const [logs, setLogs] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    setLogs(prev => [...prev, logEntry]);
  };

  // Add immediate logging when component mounts
  React.useEffect(() => {
    addLog('🔧 Component mounted, OAuth hook initialized');
    addLog(`🔧 Client ID: ${import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Present' : 'Missing'}`);
    addLog(`🔧 Current origin: ${window.location.origin}`);
    // Check if Google library is loaded
    if (typeof window !== 'undefined' && (window as any).google) {
      addLog('✅ Google library is loaded');
    } else {
      addLog('⚠️ Google library not detected');
    }
  }, []);

  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    redirect_uri: window.location.origin + '/signin-debug',
    onSuccess: async (codeResponse: CodeResponse) => {
      addLog(`✅ OAuth Success! Auth code received: ${codeResponse.code ? 'YES' : 'NO'}`);
      setIsLoading(true);
      setError(null);

      try {
        addLog('📤 Sending auth code to backend...');
        
        const response = await fetch('/api/auth/google-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: codeResponse.code,
            redirect_uri: window.location.origin + '/signin-debug'
          })
        });

        addLog(`📥 Backend response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          addLog(`❌ Backend error: ${errorText}`);
          throw new Error('Backend error: ' + errorText);
        }

        const data = await response.json();
        addLog(`✅ Backend response received`);
        addLog(`📦 Response has sessionToken: ${data.sessionToken ? 'YES' : 'NO'}`);
        addLog(`📦 Response has user: ${data.user ? 'YES' : 'NO'}`);
        
        if (data.sessionToken) {
          addLog(`💾 Storing session token in localStorage`);
          localStorage.setItem('sessionToken', data.sessionToken);
          
          // Verify it was stored
          const stored = localStorage.getItem('sessionToken');
          addLog(`✅ Token stored successfully: ${stored ? 'YES' : 'NO'}`);
          
          // Test validation endpoint directly
          addLog('🔍 Testing validation endpoint with stored token...');
          const validationResponse = await fetch('/api/auth/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: stored })
          });
          
          addLog(`📥 Validation response status: ${validationResponse.status}`);
          
          if (validationResponse.ok) {
            const validationData = await validationResponse.json();
            addLog(`✅ Validation successful: ${JSON.stringify(validationData, null, 2)}`);
            addLog(`📦 Valid: ${validationData.valid}`);
            addLog(`📦 User email: ${validationData.user?.email || 'NO USER'}`);
          } else {
            const errorText = await validationResponse.text();
            addLog(`❌ Validation failed: ${errorText}`);
          }
          
          // Add a delay to see logs before redirect
          addLog('⏳ Redirecting to auth-redirect page in 5 seconds...');
          addLog('💡 If redirect fails, try clicking "Force Reload & Navigate" button below');
          setTimeout(() => {
            addLog('🚀 Attempting redirect to /auth-redirect');
            // Redirect to auth-redirect page which will handle validation
            window.location.replace('/auth-redirect');
          }, 5000);
        } else {
          throw new Error('No session token in response');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        addLog(`❌ Error: ${errorMsg}`);
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (errorResponse) => {
      addLog(`❌ OAuth Error: ${JSON.stringify(errorResponse)}`);
      setError('OAuth login failed');
    },
    onNonOAuthError: (errorResponse) => {
      addLog(`❌ Non-OAuth Error: ${JSON.stringify(errorResponse)}`);
      setError('Non-OAuth error occurred');
    },
    scope: 'openid email profile',
    ux_mode: 'popup'
  });

  const checkCurrentState = () => {
    addLog('=== Current State Check ===');
    const token = localStorage.getItem('sessionToken');
    addLog(`localStorage sessionToken: ${token ? 'EXISTS' : 'NONE'}`);
    if (token) {
      addLog(`Token preview: ${token.substring(0, 20)}...`);
    }
    addLog(`Current URL: ${window.location.href}`);
    addLog(`Current origin: ${window.location.origin}`);
  };

  const clearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    addLog('✅ Cleared all storage');
    checkCurrentState();
  };

  const forceReloadAndNavigate = () => {
    const token = localStorage.getItem('sessionToken');
    if (token) {
      addLog('🔄 Force reloading and navigating to auth-redirect...');
      // Navigate to auth-redirect page which will handle validation
      window.location.href = '/auth-redirect';
    } else {
      addLog('⚠️ No session token found. Please sign in first.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Debug Sign In
            </h1>
            <p className="text-sm text-gray-500">
              OAuth Flow Debugging
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 text-sm">Processing...</span>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    addLog('🚀 Starting Google login...');
                    addLog(`🔧 Attempting OAuth with redirect_uri: ${window.location.origin}/signin-debug`);
                    try {
                      googleLogin();
                      addLog('✅ OAuth popup/redirect initiated');
                    } catch (error) {
                      addLog(`❌ Failed to initiate OAuth: ${error}`);
                      setError(`Failed to start OAuth: ${error}`);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="font-medium">Sign in with Google (Debug)</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={checkCurrentState}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Check State
                  </button>
                  <button
                    onClick={clearStorage}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Clear Storage
                  </button>
                </div>

                <button
                  onClick={forceReloadAndNavigate}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  🔄 Force Reload & Navigate to Portal
                </button>
              </>
            )}
          </div>

          {/* Debug Logs */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Debug Logs:</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div>No logs yet. Click "Check State" or try signing in.</div>
              ) : (
                logs.map((log, i) => (
                  <div 
                    key={i} 
                    className={
                      log.includes('❌') ? 'text-red-400' : 
                      log.includes('✅') ? 'text-green-400' :
                      log.includes('📤') || log.includes('📥') ? 'text-blue-400' :
                      log.includes('⚠️') ? 'text-yellow-400' : ''
                    }
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 text-center">
            <a href="/signin" className="text-blue-600 hover:underline">← Back to regular sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}

