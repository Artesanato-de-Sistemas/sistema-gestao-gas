import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Inbounds } from '@/pages/Inbounds';
import { DriversDashboard } from '@/pages/DriversDashboard';
import { Customers } from '@/pages/Customers';
import { Sales } from '@/pages/Sales';
import { Stock } from '@/pages/Stock';
import { useAuthStore } from '@/store/useAuth';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/inbounds" replace />} />
        <Route path="inbounds" element={<Inbounds />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Mocking other routes for now */}
        <Route path="estoque" element={<Stock />} />
        <Route path="entregadores" element={<DriversDashboard />} />
        <Route path="vendas" element={<Sales />} />
        <Route path="clientes" element={<Customers />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
