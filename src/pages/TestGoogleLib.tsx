import React, { useEffect, useState } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

function TestContent() {
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    setLogs(prev => [...prev, logEntry]);
  };

  // Test with implicit flow (simpler, no backend needed)
  const implicitLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: (tokenResponse) => {
      addLog(`✅ SUCCESS (implicit): Token received, length: ${tokenResponse.access_token?.length}`);
    },
    onError: (error) => {
      addLog(`❌ ERROR (implicit): ${JSON.stringify(error)}`);
    },
    scope: 'openid email profile'
  });

  // Test with auth-code flow (what you're currently using)
  const authCodeLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: (codeResponse) => {
      addLog(`✅ SUCCESS (auth-code): Code received: ${codeResponse.code ? 'YES' : 'NO'}`);
    },
    onError: (error) => {
      addLog(`❌ ERROR (auth-code): ${JSON.stringify(error)}`);
    },
    scope: 'openid email profile'
  });

  useEffect(() => {
    addLog('Component mounted');
    addLog(`Client ID from env: ${import.meta.env.VITE_GOOGLE_CLIENT_ID?.substring(0, 30)}...`);
    addLog(`Window origin: ${window.location.origin}`);
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Testing @react-oauth/google Library</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Test 1: Implicit Flow</h3>
          <button
            onClick={() => {
              addLog('Starting implicit flow...');
              implicitLogin();
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Test Implicit Flow
          </button>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Test 2: Auth Code Flow</h3>
          <button
            onClick={() => {
              addLog('Starting auth-code flow...');
              authCodeLogin();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test Auth Code Flow
          </button>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Logs:</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div>No logs yet...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={log.includes('ERROR') ? 'text-red-400' : log.includes('SUCCESS') ? 'text-green-400' : ''}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TestGoogleLib() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [providerError, setProviderError] = useState<string | null>(null);

  // Test if provider initializes correctly
  useEffect(() => {
    if (!clientId) {
      setProviderError('No client ID found in environment');
    } else if (!clientId.includes('.apps.googleusercontent.com')) {
      setProviderError('Invalid client ID format');
    }
  }, [clientId]);

  if (providerError) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Provider Error</h1>
          <p>{providerError}</p>
          <p className="mt-2 text-sm">Client ID: {clientId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Google OAuth Library Test</h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <p className="text-sm font-mono">Client ID: {clientId?.substring(0, 40)}...</p>
        </div>

        <GoogleOAuthProvider 
          clientId={clientId}
          onScriptLoadSuccess={() => console.log('✅ Google script loaded successfully')}
          onScriptLoadError={() => console.error('❌ Google script failed to load')}
        >
          <TestContent />
        </GoogleOAuthProvider>

        <div className="mt-6 text-center">
          <a href="/simple-oauth" className="text-blue-600 hover:underline mr-4">Simple OAuth Test</a>
          <a href="/signin" className="text-blue-600 hover:underline">Regular Sign In</a>
        </div>
      </div>
    </div>
  );
}