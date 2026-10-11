import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingState from './components/LoadingState';

// Functional Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MarketplacePage from './pages/MarketplacePage';
import BusinessDetailPage from './pages/BusinessDetailPage';
import SavedBusinessesPage from './pages/SavedBusinessesPage';
import SentInterestsPage from './pages/SentInterestsPage';
import BusinessProfilePage from './pages/BusinessProfilePage';
import ReceivedInterestsPage from './pages/ReceivedInterestsPage';

/**
 * GuestRoute — Redirects authenticated users away from login/register to dashboard
 */
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingState message="Checking authentication session..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Shared application layout with persistent header nav and footer */}
          <Route element={<AppLayout />}>
            {/* Public landing */}
            <Route path="/" element={<HomePage />} />

            {/* Guest routes (redirect to dashboard if logged in) */}
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <RegisterPage />
                </GuestRoute>
              }
            />

            {/* Common protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/businesses/:id"
              element={
                <ProtectedRoute>
                  <BusinessDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Investor protected routes */}
            <Route
              path="/marketplace"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <MarketplacePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <SavedBusinessesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interests/sent"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <SentInterestsPage />
                </ProtectedRoute>
              }
            />

            {/* Business owner protected routes */}
            <Route
              path="/business/profile"
              element={
                <ProtectedRoute allowedRoles={['business']}>
                  <BusinessProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interests/received"
              element={
                <ProtectedRoute allowedRoles={['business']}>
                  <ReceivedInterestsPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
