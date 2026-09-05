import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Customers } from '@/pages/Customers';
import { Entrada } from '@/pages/Entrada';
import { Planilha } from '@/pages/Planilha';
import { Pesquisa } from '@/pages/Pesquisa';
import { useAuthStore } from '@/store/useAuth';

/** Redireciona para /login se não autenticado. */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Redireciona para /planilha se não for ADMIN. */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAdmin = useAuthStore((state) => state.isAdmin);
  if (!isAdmin) return <Navigate to="/planilha" replace />;
  return <>{children}</>;
}

/** Redirecionamento da raiz baseado na role */
function HomeRedirect() {
  const isAdmin = useAuthStore((state) => state.isAdmin);
  return <Navigate to={isAdmin ? "/dashboard" : "/planilha"} replace />;
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
        <Route index element={<HomeRedirect />} />

        {/* Rotas de Colaborador e Administrador */}
        <Route path="entrada" element={<Entrada />} />
        <Route path="inbounds" element={<Navigate to="/entrada" replace />} />
        <Route path="planilha" element={<Planilha />} />
        <Route path="clientes" element={<Customers />} />

        {/* Rotas Exclusivas do Administrador */}
        <Route
          path="dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />
        <Route
          path="pesquisa"
          element={
            <AdminRoute>
              <Pesquisa />
            </AdminRoute>
          }
        />

        {/* Redirecionamentos legados */}
        <Route path="vendas" element={<Navigate to="/planilha" replace />} />
        <Route path="estoque" element={<Navigate to="/entrada" replace />} />
        <Route path="entregadores" element={<Navigate to="/pesquisa" replace />} />
        <Route path="colaboradores" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
