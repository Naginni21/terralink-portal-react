import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';

export function OAuthMinimal() {
  const [status, setStatus] = React.useState<string>('Ready');
  const [logs, setLogs] = React.useState<string[]>([]);

  const addLog = (msg: string) => {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(entry);
    setLogs(prev => [...prev, entry]);
  };

  React.useEffect(() => {
    // Check environment on mount
    addLog('Component mounted');
    addLog(`Client ID: ${import.meta.env.VITE_GOOGLE_CLIENT_ID?.substring(0, 20)}...`);
    addLog(`Origin: ${window.location.origin}`);
    addLog(`Google lib: ${typeof (window as any).google !== 'undefined' ? 'Loaded' : 'Not loaded'}`);
    
    // Check if we're in an iframe
    if (window !== window.top) {
      addLog('⚠️ Running in iframe - OAuth may be blocked');
    }
    
    // Check for popup blockers
    const testPopup = window.open('', '_blank', 'width=1,height=1');
    if (testPopup) {
      testPopup.close();
      addLog('✅ Popups are allowed');
    } else {
      addLog('⚠️ Popups may be blocked');
    }
  }, []);

  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    ux_mode: 'popup',
    redirect_uri: `${window.location.origin}/oauth-minimal`,
    onSuccess: (response) => {
      setStatus('Success!');
      addLog(`✅ Success: ${JSON.stringify(response)}`);
    },
    onError: (error) => {
      setStatus('Error!');
      addLog(`❌ Error: ${JSON.stringify(error)}`);
    },
    onNonOAuthError: (error) => {
      setStatus('Non-OAuth Error!');
      addLog(`❌ Non-OAuth Error: ${JSON.stringify(error)}`);
    }
  });

  const testDirectAuth = () => {
    addLog('Testing direct Google Auth...');
    setStatus('Authenticating...');
    
    try {
      // Direct OAuth URL construction
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = encodeURIComponent(`${window.location.origin}/oauth-minimal`);
      const scope = encodeURIComponent('openid email profile');
      const responseType = 'code';
      const accessType = 'offline';
      const prompt = 'consent';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `response_type=${responseType}&` +
        `scope=${scope}&` +
        `access_type=${accessType}&` +
        `prompt=${prompt}`;
      
      addLog(`Opening: ${authUrl.substring(0, 100)}...`);
      window.location.href = authUrl;
    } catch (error) {
      addLog(`❌ Direct auth error: ${error}`);
      setStatus('Direct auth failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-xl font-bold mb-4">Minimal OAuth Test</h1>
          
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <p className="text-sm">Status: <strong>{status}</strong></p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                addLog('Calling googleLogin()...');
                setStatus('Calling OAuth...');
                try {
                  googleLogin();
                  addLog('OAuth function called');
                } catch (e) {
                  addLog(`Exception: ${e}`);
                  setStatus('Exception thrown');
                }
              }}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test OAuth Library
            </button>

            <button
              onClick={testDirectAuth}
              className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Test Direct OAuth (Redirect)
            </button>

            <button
              onClick={() => {
                setLogs([]);
                setStatus('Ready');
              }}
              className="w-full py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Logs
            </button>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Logs:</h3>
            <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <div>No logs yet</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={
                    log.includes('❌') ? 'text-red-400' :
                    log.includes('✅') ? 'text-green-400' :
                    log.includes('⚠️') ? 'text-yellow-400' : ''
                  }>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 text-center">
            <a href="/signin" className="text-blue-600 hover:underline text-sm">
              ← Back to Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}