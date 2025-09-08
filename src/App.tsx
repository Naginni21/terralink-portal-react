import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { SignIn } from './pages/SignIn';
import { Portal } from './pages/Portal';
import Admin from './pages/Admin';
import { OAuthDebug } from './pages/OAuthDebug';
import { SimpleOAuth } from './pages/SimpleOAuth';
import { TestGoogleLib } from './pages/TestGoogleLib';
import { SignInLocal } from './pages/SignInLocal';
import { SignInDebug } from './pages/SignInDebug';
import { AuthRedirect } from './pages/AuthRedirect';
import { OAuthMinimal } from './pages/OAuthMinimal';
import { UniversalSignIn } from './pages/UniversalSignIn';

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  // Debug logging for OAuth configuration
  console.log('[OAuth Debug] Client ID:', clientId);
  console.log('[OAuth Debug] Current origin:', window.location.origin);
  console.log('[OAuth Debug] Environment:', import.meta.env.MODE);
  
  if (!clientId) {
    console.error('[OAuth Error] No client ID found! Check VITE_GOOGLE_CLIENT_ID env variable');
  }
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signin-local" element={<SignInLocal />} />
            <Route path="/signin-debug" element={<SignInDebug />} />
            <Route path="/auth-redirect" element={<AuthRedirect />} />
            <Route path="/oauth-debug" element={<OAuthDebug />} />
            <Route path="/simple-oauth" element={<SimpleOAuth />} />
            <Route path="/test-lib" element={<TestGoogleLib />} />
            <Route path="/oauth-minimal" element={<OAuthMinimal />} />
            <Route path="/universal-signin" element={<UniversalSignIn />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Portal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal"
              element={
                <ProtectedRoute>
                  <Portal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;