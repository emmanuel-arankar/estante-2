import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { RoleProtectedRoute } from '../../router/RoleProtectedRoute';
import { withSuspense } from '../../router/RouteSuspense';
import { PATHS } from '../../router/paths';

const AdminDashboard = lazy(() => import('../../pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

export const adminRoutes: RouteObject = {
  element: <RoleProtectedRoute allowedRoles={['admin']} />, 
  children: [
    {
      path: PATHS.ADMIN_DASHBOARD,
      element: withSuspense(AdminDashboard),
      handle: {
        title: () => 'Painel do administrador | Estante de Bolso',
      },
    },
  ],
};
