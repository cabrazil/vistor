import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReservationDetailPage from './pages/ReservationDetailPage';
import InspectionFlowPage from './pages/InspectionFlowPage';
import InspectionSummaryPage from './pages/InspectionSummaryPage';
import ComparisonPage from './pages/ComparisonPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-950">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500">
          <span className="text-lg font-bold text-white">V</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reservations/:id"
        element={
          <ProtectedRoute>
            <ReservationDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inspections/:id"
        element={
          <ProtectedRoute>
            <InspectionFlowPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inspections/:id/summary"
        element={
          <ProtectedRoute>
            <InspectionSummaryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inspections/:id/comparison"
        element={
          <ProtectedRoute>
            <ComparisonPage />
          </ProtectedRoute>
        }
      />
      {/* Catch-all redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
