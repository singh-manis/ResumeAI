import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { lazy, Suspense } from 'react';
import './styles/index.css';

// Pages - Lazy loaded for code splitting
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import OAuthCallback from './pages/auth/OAuthCallback';
import LandingPage from './pages/LandingPage';

// Lazy load heavy dashboard components for better initial load
const CandidateDashboard = lazy(() => import('./pages/candidate/Dashboard'));
const RecruiterDashboard = lazy(() => import('./pages/recruiter/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));

// Loading fallback component
const PageLoader = () => (
  <div className="loading-screen">
    <div className="loader"></div>
    <p>Loading...</p>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case 'CANDIDATE':
        return <Navigate to="/candidate" replace />;
      case 'RECRUITER':
        return <Navigate to="/recruiter" replace />;
      case 'ADMIN':
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

// Public Route - redirects to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    switch (user.role) {
      case 'CANDIDATE':
        return <Navigate to="/candidate" replace />;
      case 'RECRUITER':
        return <Navigate to="/recruiter" replace />;
      case 'ADMIN':
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      <Route path="/oauth/callback" element={<OAuthCallback />} />

      {/* Candidate Routes */}
      <Route
        path="/candidate/*"
        element={
          <ProtectedRoute allowedRoles={['CANDIDATE']}>
            <Suspense fallback={<PageLoader />}>
              <CandidateDashboard />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Recruiter Routes */}
      <Route
        path="/recruiter/*"
        element={
          <ProtectedRoute allowedRoles={['RECRUITER']}>
            <Suspense fallback={<PageLoader />}>
              <RecruiterDashboard />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Suspense fallback={<PageLoader />}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Catch all - 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <ThemeProvider>
            <Router>
              <AppRoutes />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  },
                  success: {
                    iconTheme: {
                      primary: 'var(--success)',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: 'var(--error)',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </Router>
          </ThemeProvider>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
