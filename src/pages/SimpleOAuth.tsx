import { useEffect, useState } from 'react';

declare global {
  interface Window {
    google: any;
    handleCredentialResponse: (response: any) => void;
  }
}

export function SimpleOAuth() {
  const [status, setStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  
  const CLIENT_ID = '655900320406-5gtpn7qdeit1umai8jt3qvvkagedgsio.apps.googleusercontent.com';

  useEffect(() => {
    // Define the callback function
    window.handleCredentialResponse = (response: any) => {
      console.log('Credential response:', response);
      setStatus('Received credential response!');
      // Here you would normally send response.credential to your backend
    };

    // Load the Google Identity Services library
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Google Identity Services loaded');
      setGoogleLoaded(true);
      setStatus('Google library loaded, initializing...');
      
      try {
        // Initialize Google Sign-In
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: window.handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        
        // Render the sign-in button
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          { 
            theme: 'outline',
            size: 'large',
            width: 300,
            text: 'signin_with',
            shape: 'rectangular'
          }
        );
        
        setStatus('Ready - Click button to sign in');
        console.log('Google Sign-In initialized successfully');
      } catch (err) {
        console.error('Error initializing Google Sign-In:', err);
        setError(`Initialization error: ${err}`);
        setStatus('Failed to initialize');
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Identity Services');
      setError('Failed to load Google Identity Services');
      setStatus('Failed to load Google library');
    };
    
    document.body.appendChild(script);
    
    return () => {
      // Cleanup
      const scriptElement = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (scriptElement) {
        document.body.removeChild(scriptElement);
      }
    };
  }, []);

  // Manual OAuth flow (alternative approach)
  const handleManualOAuth = () => {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', window.location.origin + '/signin');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'select_account');
    
    console.log('Redirecting to:', authUrl.toString());
    window.location.href = authUrl.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Simple OAuth Test</h1>
          
          {/* Status Display */}
          <div className="mb-6 p-4 bg-gray-100 rounded">
            <h2 className="font-semibold mb-2">Status:</h2>
            <p className="text-sm">{status}</p>
            {error && (
              <p className="text-red-600 mt-2 text-sm">{error}</p>
            )}
          </div>

          {/* Configuration Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded">
            <h2 className="font-semibold mb-2">Configuration:</h2>
            <div className="text-xs font-mono space-y-1">
              <p>Client ID: {CLIENT_ID.substring(0, 30)}...</p>
              <p>Origin: {window.location.origin}</p>
              <p>Google Loaded: {googleLoaded ? '✅ Yes' : '❌ No'}</p>
            </div>
          </div>

          {/* Google Sign-In Button (rendered by Google) */}
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Method 1: Google Identity Services</h2>
            <div id="googleSignInButton"></div>
          </div>

          {/* Manual OAuth Button */}
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Method 2: Manual OAuth Flow</h2>
            <button
              onClick={handleManualOAuth}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Sign in with Google (Manual)
            </button>
          </div>

          {/* Console Output */}
          <div className="p-4 bg-gray-900 text-green-400 rounded">
            <p className="text-xs font-mono">Check browser console for detailed logs</p>
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <a href="/signin" className="text-blue-600 hover:underline">← Back to regular sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}