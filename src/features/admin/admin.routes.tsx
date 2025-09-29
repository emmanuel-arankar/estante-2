import { Outlet } from 'react-router-dom';
import { RoleProtectedRoute } from '../../router/RoleProtectedRoute';

/**
 * Este é o componente de layout para TODA a seção /admin.
 * Ele garante que apenas admins possam acessar qualquer rota filha
 * e provê um <Outlet /> para renderizar a rota filha específica.
 */
export function Component() {
  return (
    <RoleProtectedRoute allowedRoles={['admin']}>
      <Outlet />
    </RoleProtectedRoute>
  );
}

// Opcional: Adicionar um nome de exibição para facilitar a depuração
Component.displayName = 'AdminLayout';