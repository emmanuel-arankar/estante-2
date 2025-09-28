import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

// Layout e Utilitários
import { Layout } from '../components/layout/Layout';
import { ContainedLayout } from '../components/layout/ContainedLayout'; 
import { ProtectedRoute } from './ProtectedRoute';
import { withSuspense } from './RouteSuspense';
import { NotFound } from '../pages/NotFound';

// Loaders
import { layoutLoader } from './loaders';

// Módulos de Rota
import { authRoutes } from '../features/auth/auth.routes';
import { profileRoutes, protectedProfileRoutes } from '../features/profile/profile.routes';
import { friendsRoutes } from '../features/friends/friends.routes';
import { protectedChatRoutes } from '../features/chat/chat.routes';
import { notificationRoutes } from '../features/notifications/notifications.routes';
import { adminRoutes } from '../features/admin/admin.routes';

import { PATHS } from './paths';

const Home = lazy(() => import('../pages/Home').then(module => ({ default: module.Home })));

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    errorElement: <NotFound />,
    loader: layoutLoader,
    children: [
      // --- Rotas de Tela Cheia (sem container) ---
      {
        path: PATHS.HOME,
        element: withSuspense(Home),
        handle: {
          title: () => 'Estante de Bolso - Sua rede social de leitura',
        },
      },
      ...authRoutes,

      // --- Rotas Contidas (com container e breadcrumbs) ---
      {
        element: <ContainedLayout />,
        children: [
          ...profileRoutes, // Perfil público
          {
            element: <ProtectedRoute />,
            children: [
              ...protectedProfileRoutes,
              ...friendsRoutes,
              ...notificationRoutes,
              ...protectedChatRoutes,
              adminRoutes,
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
];
