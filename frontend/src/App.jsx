import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/shared/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PacientesPage from './pages/PacientesPage';
import PacienteDetallePage from './pages/PacienteDetallePage';
import CitasPage from './pages/CitasPage';
import SesionPage from './pages/SesionPage';
import CatalogoPage from './pages/CatalogoPage';
import EquipoPage from './pages/EquipoPage';
import AdminPage from './pages/AdminPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-mag-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="pacientes" element={<PacientesPage />} />
        <Route path="pacientes/:id" element={<PacienteDetallePage />} />
        <Route path="citas" element={<CitasPage />} />
        <Route path="sesion/:id" element={<SesionPage />} />
        <Route path="catalogo" element={<CatalogoPage />} />
        <Route path="equipo" element={<EquipoPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
