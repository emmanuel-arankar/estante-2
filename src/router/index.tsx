import { lazy } from 'react';
import { createBrowserRouter, RouteObject } from 'react-router-dom';

// Layout e Utilitários
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from './ProtectedRoute';
import { withSuspense } from './RouteSuspense';
import { NotFound } from '../pages/NotFound';

// Loaders
import { layoutLoader, notificationsLoader } from './loaders';

// Módulos de Rota
import { authRoutes } from '../features/auth/auth.routes';
import { profileRoutes, protectedProfileRoutes } from '../features/profile/profile.routes';
import { friendsRoutes } from '../features/friends/friends.routes';
import { protectedChatRoutes } from '../features/chat/chat.routes';

// Componentes Lazy
const Home = lazy(() => import('../pages/Home').then(module => ({ default: module.Home })));
const Notifications = lazy(() => import('../pages/Notifications').then(module => ({ default: module.Notifications })));

// # atualizado: Todas as rotas agora são importadas e compostas
const publicRoutes: RouteObject[] = [
  {
    path: '/',
    element: withSuspense(Home),
  },
  ...authRoutes,
  ...profileRoutes,
  ...friendsRoutes,
  {
    path: '/notifications',
    element: withSuspense(Notifications),
    loader: notificationsLoader,
  },
];

const protectedRoutes: RouteObject[] = [
  protectedProfileRoutes,
  ...protectedChatRoutes,
];

export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <NotFound />,
    loader: layoutLoader,
    children: [
      ...publicRoutes,
      {
        element: <ProtectedRoute />,
        children: protectedRoutes,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
