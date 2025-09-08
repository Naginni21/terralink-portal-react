import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function OAuthInfo() {
  const navigate = useNavigate();
  const [showInstructions, setShowInstructions] = useState(false);
  
  const currentOrigin = window.location.origin;
  const redirectUri = `${currentOrigin}/signin`;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">OAuth Configuration Info</h1>
            <button
              onClick={() => navigate('/signin')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-semibold text-blue-900 mb-2">Current Configuration</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Origin:</span>{' '}
                  <code className="bg-white px-2 py-1 rounded">{currentOrigin}</code>
                </div>
                <div>
                  <span className="font-medium">Redirect URI:</span>{' '}
                  <code className="bg-white px-2 py-1 rounded">{redirectUri}</code>
                </div>
                <div>
                  <span className="font-medium">Client ID:</span>{' '}
                  <code className="bg-white px-2 py-1 rounded text-xs">{clientId || 'NOT SET'}</code>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="font-semibold text-yellow-900 mb-2">⚠️ Google Console Configuration</h2>
              <p className="text-sm text-yellow-800 mb-3">
                Make sure the following Authorized redirect URI is added in your Google Cloud Console:
              </p>
              <div className="bg-white border border-yellow-300 rounded p-3">
                <code className="text-sm font-mono break-all">{redirectUri}</code>
              </div>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="mt-3 text-sm text-yellow-700 hover:text-yellow-900 underline"
              >
                {showInstructions ? 'Hide' : 'Show'} Instructions
              </button>
            </div>

            {showInstructions && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-3">How to Update Google Console:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console → Credentials</a></li>
                  <li>Find your OAuth 2.0 Client ID (should match the Client ID shown above)</li>
                  <li>Click on it to edit</li>
                  <li>Scroll to "Authorized redirect URIs"</li>
                  <li>Add exactly this URI: <code className="bg-white px-1">{redirectUri}</code></li>
                  <li>Click "Save" at the bottom</li>
                  <li>Wait 5-10 minutes for changes to propagate</li>
                </ol>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="font-semibold text-green-900 mb-2">✓ Required URIs</h2>
              <p className="text-sm text-green-800 mb-3">
                All these URIs should be in your Google Console:
              </p>
              <ul className="space-y-1 text-sm">
                <li>• <code className="bg-white px-2 py-1 rounded">{redirectUri}</code> (Primary)</li>
                {currentOrigin !== 'https://terralink-portal.vercel.app' && (
                  <li>• <code className="bg-white px-2 py-1 rounded">https://terralink-portal.vercel.app/signin</code> (Production)</li>
                )}
                <li>• <code className="bg-white px-2 py-1 rounded">http://localhost:6001/signin</code> (Development)</li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h2 className="font-semibold mb-2">Test OAuth Flow</h2>
              <p className="text-sm text-gray-600 mb-3">
                Click the button below to test the OAuth flow with the current configuration:
              </p>
              <button
                onClick={() => {
                  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                    `client_id=${clientId}&` +
                    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                    `response_type=code&` +
                    `scope=${encodeURIComponent('openid email profile')}&` +
                    `access_type=offline&` +
                    `prompt=select_account`;
                  
                  console.log('[OAuth Test] Redirecting to:', authUrl);
                  window.location.href = authUrl;
                }}
                disabled={!clientId}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test OAuth Login
              </button>
              {!clientId && (
                <p className="mt-2 text-sm text-red-600">
                  Client ID is not configured. Check your environment variables.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}