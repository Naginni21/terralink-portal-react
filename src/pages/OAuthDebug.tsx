import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react';

export function OAuthDebug() {
  const [testResult, setTestResult] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);
  
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const currentOrigin = window.location.origin;
  const environment = import.meta.env.MODE;
  
  // Expected configuration
  const expectedOrigins = {
    production: ['https://terralink-portal.vercel.app', 'https://terralink-portal-react.vercel.app'],
    development: ['http://localhost:6001', 'http://localhost:5173', 'http://localhost:3000']
  };
  
  const expectedRedirectUris = {
    production: ['https://terralink-portal.vercel.app/signin', 'https://terralink-portal-react.vercel.app/signin'],
    development: ['http://localhost:6001/signin', 'http://localhost:5173/signin', 'http://localhost:3000/signin']
  };

  // Test Google OAuth
  const testGoogleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: (response) => {
      setTestResult(`✅ OAuth Success! Auth code received: ${response.code ? 'Yes' : 'No'}`);
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('OAuth Test Error:', error);
      setTestResult(`❌ OAuth Error: ${JSON.stringify(error)}`);
      setIsLoading(false);
    },
    scope: 'openid email profile'
  });

  const runOAuthTest = () => {
    setIsLoading(true);
    setTestResult('Testing OAuth...');
    testGoogleLogin();
  };

  // Check if current origin is in expected list
  const isOriginConfigured = environment === 'production' 
    ? expectedOrigins.production.includes(currentOrigin)
    : expectedOrigins.development.includes(currentOrigin);

  // Validate client ID format
  const isValidClientId = clientId && 
    clientId.includes('.apps.googleusercontent.com') &&
    clientId.split('-').length === 2;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            OAuth Configuration Debug
          </h1>

          {/* Environment Info */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Environment Information</h2>
            <div className="space-y-2 bg-gray-50 p-4 rounded">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">Environment:</span>
                <code className="bg-gray-200 px-2 py-1 rounded">{environment}</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">Current Origin:</span>
                <code className="bg-gray-200 px-2 py-1 rounded">{currentOrigin}</code>
                {isOriginConfigured ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">Redirect URI:</span>
                <code className="bg-gray-200 px-2 py-1 rounded">{currentOrigin}/signin</code>
              </div>
            </div>
          </div>

          {/* Client ID Validation */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">OAuth Client ID</h2>
            <div className="space-y-2 bg-gray-50 p-4 rounded">
              {clientId ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">Client ID:</span>
                    <code className="bg-gray-200 px-2 py-1 rounded text-xs break-all">{clientId}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">Format Valid:</span>
                    {isValidClientId ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-4 h-4" />
                  <span>No Client ID found! Check VITE_GOOGLE_CLIENT_ID environment variable</span>
                </div>
              )}
            </div>
          </div>

          {/* Required Configuration */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Required Google Cloud Console Configuration</h2>
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <h3 className="font-semibold mb-2">Authorized JavaScript Origins:</h3>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                {(environment === 'production' ? expectedOrigins.production : expectedOrigins.development).map(origin => (
                  <li key={origin} className="font-mono text-sm">
                    {origin}
                    {origin === currentOrigin && <span className="text-green-600 ml-2">← Current</span>}
                  </li>
                ))}
              </ul>
              
              <h3 className="font-semibold mb-2">Authorized Redirect URIs:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {(environment === 'production' ? expectedRedirectUris.production : expectedRedirectUris.development).map(uri => (
                  <li key={uri} className="font-mono text-sm">
                    {uri}
                    {uri === `${currentOrigin}/signin` && <span className="text-green-600 ml-2">← Current</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* OAuth Test */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">OAuth Test</h2>
            <div className="bg-gray-50 p-4 rounded">
              <button
                onClick={runOAuthTest}
                disabled={isLoading || !clientId}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Testing...' : 'Test OAuth Login'}
              </button>
              
              {testResult && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <pre className="text-sm">{testResult}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">How to Fix</h2>
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
                <li>Find your OAuth 2.0 Client ID: <code className="bg-gray-200 px-1">{clientId?.split('-')[0]}...</code></li>
                <li>Click on it to edit</li>
                <li>Add all the Authorized JavaScript origins listed above</li>
                <li>Add all the Authorized redirect URIs listed above</li>
                <li>Save and wait 5 minutes for changes to propagate</li>
                <li>Clear browser cache and try again</li>
              </ol>
            </div>
          </div>

          {/* Common Issues */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Common Issues</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Client ID not found</p>
                  <p className="text-sm text-gray-600">The OAuth client was deleted or doesn't exist in Google Cloud Console</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">redirect_uri_mismatch</p>
                  <p className="text-sm text-gray-600">The current URL is not in the authorized redirect URIs list</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Access blocked</p>
                  <p className="text-sm text-gray-600">OAuth consent screen not configured or app in testing mode</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <a href="/signin" className="text-blue-600 hover:underline">← Back to Sign In</a>
        </div>
      </div>
    </div>
  );
}