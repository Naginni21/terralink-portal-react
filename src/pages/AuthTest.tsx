import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function AuthTest() {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test: string, status: 'success' | 'error' | 'warning', details: any) => {
    setTestResults(prev => [...prev, { test, status, details, timestamp: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Check if API is accessible
    try {
      addResult('API Connectivity', 'success', 'Starting API connectivity test...');
      const testResponse = await fetch('/api/test');
      const testData = await testResponse.json();
      
      if (testResponse.ok && testData.success) {
        addResult('API Connectivity', 'success', {
          message: 'API is accessible',
          data: testData
        });
      } else {
        addResult('API Connectivity', 'error', {
          message: 'API returned unexpected response',
          status: testResponse.status,
          data: testData
        });
      }
    } catch (error) {
      addResult('API Connectivity', 'error', {
        message: 'Failed to connect to API',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Check environment variables
    try {
      const response = await fetch('/api/test');
      const data = await response.json();
      
      if (data.environment) {
        const env = data.environment;
        
        if (env.hasGoogleClientId) {
          addResult('Google Client ID', 'success', 'Google Client ID is configured');
        } else {
          addResult('Google Client ID', 'error', 'Google Client ID is NOT configured');
        }
        
        if (env.hasGoogleClientSecret) {
          addResult('Google Client Secret', 'success', 'Google Client Secret is configured');
        } else {
          addResult('Google Client Secret', 'error', 'Google Client Secret is NOT configured');
        }
        
        if (env.hasJwtSecret) {
          addResult('JWT Secret', 'success', 'JWT Secret is configured');
        } else {
          addResult('JWT Secret', 'error', 'JWT Secret is NOT configured');
        }
      }
    } catch (error) {
      addResult('Environment Check', 'error', {
        message: 'Failed to check environment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Check OAuth callback endpoint
    try {
      const response = await fetch('/api/auth/google-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'test_code' })
      });
      
      // We expect this to fail with 401 (invalid code) but it should be accessible
      if (response.status === 401 || response.status === 400) {
        addResult('OAuth Callback Endpoint', 'success', {
          message: 'OAuth callback endpoint is accessible',
          status: response.status,
          statusText: response.statusText
        });
      } else if (response.status === 404) {
        addResult('OAuth Callback Endpoint', 'error', {
          message: 'OAuth callback endpoint NOT FOUND - API routing issue',
          status: response.status
        });
      } else {
        const data = await response.text();
        addResult('OAuth Callback Endpoint', 'warning', {
          message: 'Unexpected response from OAuth endpoint',
          status: response.status,
          data
        });
      }
    } catch (error) {
      addResult('OAuth Callback Endpoint', 'error', {
        message: 'Failed to reach OAuth callback endpoint',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 4: Check validation endpoint
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'test_token' })
      });
      
      if (response.status === 200 || response.status === 401 || response.status === 403) {
        addResult('Validation Endpoint', 'success', {
          message: 'Validation endpoint is accessible',
          status: response.status
        });
      } else if (response.status === 404) {
        addResult('Validation Endpoint', 'error', {
          message: 'Validation endpoint NOT FOUND - API routing issue',
          status: response.status
        });
      } else {
        addResult('Validation Endpoint', 'warning', {
          message: 'Unexpected response from validation endpoint',
          status: response.status
        });
      }
    } catch (error) {
      addResult('Validation Endpoint', 'error', {
        message: 'Failed to reach validation endpoint',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 5: Check current session
    const sessionToken = localStorage.getItem('sessionToken');
    if (sessionToken) {
      addResult('Session Token', 'success', {
        message: 'Session token found in localStorage',
        tokenLength: sessionToken.length,
        tokenPreview: sessionToken.substring(0, 20) + '...'
      });
      
      // Try to validate it
      try {
        const response = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: sessionToken })
        });
        
        const data = await response.json();
        if (data.valid) {
          addResult('Session Validation', 'success', {
            message: 'Session is valid',
            user: data.user
          });
        } else {
          addResult('Session Validation', 'warning', {
            message: 'Session is invalid or expired',
            reason: data.reason
          });
        }
      } catch (error) {
        addResult('Session Validation', 'error', {
          message: 'Failed to validate session',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      addResult('Session Token', 'warning', 'No session token found in localStorage');
    }

    // Test 6: Check browser info
    addResult('Browser Info', 'success', {
      userAgent: navigator.userAgent,
      cookiesEnabled: navigator.cookieEnabled,
      language: navigator.language,
      platform: navigator.platform,
      origin: window.location.origin,
      href: window.location.href
    });

    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Authentication Test Suite</h1>
            <button
              onClick={() => navigate('/signin')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This page tests various aspects of the authentication system to help diagnose issues.
            </p>
            
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
              
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${getStatusBg(result.status)}`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{result.test}</h3>
                      <div className="mt-2 text-sm text-gray-600">
                        {typeof result.details === 'string' ? (
                          <p>{result.details}</p>
                        ) : (
                          <pre className="whitespace-pre-wrap font-mono text-xs bg-white/50 p-2 rounded">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}