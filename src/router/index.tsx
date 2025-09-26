import { lazy } from 'react';
import { createBrowserRouter, RouteObject } from 'react-router-dom';

// Layout e Utilitários
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from './ProtectedRoute';
import { withSuspense } from './RouteSuspense';
import { NotFound } from '../pages/NotFound';

// Loaders
import { layoutLoader } from './loaders';

// Rotas
import {
  authRoutes,
  profileRoutes,
  protectedProfileRoutes,
  friendsRoutes,
  protectedChatRoutes,
  notificationRoutes
} from '../features/routes';

// Componente Lazy
const Home = lazy(() => import('../pages/Home').then(module => ({ default: module.Home })));

// # atualizado: Composição final das rotas
const publicRoutes: RouteObject[] = [
  {
    path: '/',
    element: withSuspense(Home),
  },
  ...authRoutes,
  ...profileRoutes,
  ...friendsRoutes,
  ...notificationRoutes, // # atualizado
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