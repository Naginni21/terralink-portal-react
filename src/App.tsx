import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';

// Lazy load pages for code splitting
const SignIn = lazy(() => import('./pages/SignIn').then(m => ({ default: m.SignIn })));
const Portal = lazy(() => import('./pages/Portal').then(m => ({ default: m.Portal })));
const Admin = lazy(() => import('./pages/Admin'));
const AuthTest = lazy(() => import('./pages/AuthTest').then(m => ({ default: m.AuthTest })));
const OAuthInfo = lazy(() => import('./pages/OAuthInfo').then(m => ({ default: m.OAuthInfo })));

// Loading component for Suspense fallback
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/auth-test" element={<AuthTest />} />
          <Route path="/oauth-info" element={<OAuthInfo />} />
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;