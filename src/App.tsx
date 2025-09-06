import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { SignIn } from './pages/SignIn';
import { Portal } from './pages/Portal';

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Portal />
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