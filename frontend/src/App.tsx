import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import MobilePunchIn from "./pages/worker/MobilePunchIn";
import MyRequests from "./pages/worker/MyRequests";
import GerenteDashboard from "./pages/manager/GerenteDashboard";
import Approvals from "./pages/manager/Approvals";

function ProtectedRoute({ children, role }: { children: JSX.Element; role?: "WORKER" | "MANAGER" }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-slate-400">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === "MANAGER" ? <Navigate to="/manager/dashboard" replace /> : <Navigate to="/worker/fichar" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomeRedirect />} />

          {/* Trabajador */}
          <Route
            path="/worker/fichar"
            element={<ProtectedRoute role="WORKER"><MobilePunchIn /></ProtectedRoute>}
          />
          <Route
            path="/worker/solicitudes"
            element={<ProtectedRoute role="WORKER"><MyRequests /></ProtectedRoute>}
          />

          {/* Gerente */}
          <Route
            path="/manager/dashboard"
            element={<ProtectedRoute role="MANAGER"><GerenteDashboard /></ProtectedRoute>}
          />
          <Route
            path="/manager/aprobaciones"
            element={<ProtectedRoute role="MANAGER"><Approvals /></ProtectedRoute>}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
