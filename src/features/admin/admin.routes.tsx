import { lazy } from 'react';
import { Outlet, RouteObject } from 'react-router-dom';
import { RoleProtectedRoute } from '../../router/RoleProtectedRoute';
import { withSuspense } from '../../router/RouteSuspense';

const AdminDashboard = lazy(() => import('../../pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

/**
 * O Componente de layout para a rota '/admin'.
 * O React Router irá renderizar as rotas filhas dentro do <Outlet />.
 */
export function Component() {
  return <RoleProtectedRoute allowedRoles={['admin']} />;
}

/**
 * As rotas filhas que serão renderizadas dentro do layout acima.
 */
export const children: RouteObject[] = [
  {
    // A rota 'index' corresponde ao caminho exato do pai, ou seja, '/admin'.
    index: true,
    element: withSuspense(AdminDashboard),
    handle: {
      title: () => 'Painel do administrador | Estante de Bolso',
    },
  },
  // Futuras rotas de admin, como /admin/users, viriam aqui.
];