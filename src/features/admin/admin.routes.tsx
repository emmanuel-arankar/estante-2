import { lazy } from 'react'; 
import { Outlet, RouteObject } from 'react-router-dom';
import { RoleProtectedRoute } from '../../router/RoleProtectedRoute';
import { withSuspense } from '../../router/RouteSuspense';

// Lazy loading do componente do dashboard
const AdminDashboard = lazy(() => import('../../pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

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

// # atualizado: A rota filha agora usa o componente com suspense
export const children: RouteObject[] = [
  {
    index: true,
    element: withSuspense(AdminDashboard),
    handle: {
      title: () => 'Painel do administrador | Estante de Bolso',
    },
  },
];