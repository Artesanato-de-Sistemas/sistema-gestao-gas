import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Inbounds } from '@/pages/Inbounds';
import { DriversDashboard } from '@/pages/DriversDashboard';
import { Customers } from '@/pages/Customers';
import { Sales } from '@/pages/Sales';
import { Stock } from '@/pages/Stock';
import { Employees } from '@/pages/Employees';
import { useAuthStore } from '@/store/useAuth';
import { Pesquisa } from '@/pages/Pesquisa';
import { Planilha } from '@/pages/Planilha';
import { SystemSettings } from '@/pages/SystemSettings';
import { MyProfile } from '@/pages/MyProfile';
import { Entrada } from '@/pages/Entrada'; 

/** Redireciona para /login se não autenticado. */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Redireciona para / se não for ADMIN. */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAdmin = useAuthStore((state) => state.isAdmin);
  if (!isAdmin) return <Navigate to="/" replace />;
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
        <Route path="estoque" element={<Stock />} />
        <Route path="colaboradores" element={<Employees />} />
        <Route path="entregadores" element={<DriversDashboard />} />
        <Route path="vendas" element={<Sales />} />
        <Route path="clientes" element={<Customers />} />
        <Route path="pesquisa" element={<Pesquisa />} />
        <Route path="planilha" element={<Planilha />} />
        {/* Rotas de perfil — visível a todos autenticados */}
        <Route path="meus-dados" element={<MyProfile />} />
        <Route path="/entrada" element={<Entrada />} />

        {/* Rotas de administração — exclusivas para ADMIN */}
        <Route
          path="definicoes"
          element={
            <AdminRoute>
              <SystemSettings />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
