import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Auth from '@/pages/Auth';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Students from '@/pages/Students';
import Analytics from '@/pages/Analytics';
import AITraining from '@/pages/AITraining';
import AIPrediction from '@/pages/AIPrediction';
import AtRiskStudents from '@/pages/AtRiskStudents';
import StudentDetail from '@/pages/StudentDetail';
import { GraduationCap } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center animate-pulse">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedRoute>
            <Students />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students/:id"
        element={
          <ProtectedRoute>
            <StudentDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-training"
        element={
          <ProtectedRoute>
            <AITraining />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-prediction"
        element={
          <ProtectedRoute>
            <AIPrediction />
          </ProtectedRoute>
        }
      />
      <Route
        path="/at-risk"
        element={
          <ProtectedRoute>
            <AtRiskStudents />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
