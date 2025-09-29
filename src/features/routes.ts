import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { withSuspense } from '../router/RouteSuspense';
import { PATHS } from '../router/paths';

// Exportações existentes...
export * from './auth/auth.routes';
export * from './chat/chat.routes';
export * from './friends/friends.routes';
export * from './notifications/notifications.routes';
export * from './profile/profile.routes';

const AdminDashboard = lazy(() => import('../pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

export const adminChildRoutes: RouteObject[] = [
  {
    index: true,
    element: withSuspense(AdminDashboard),
    handle: {
      title: () => 'Painel do administrador | Estante de Bolso',
    },
  },
];