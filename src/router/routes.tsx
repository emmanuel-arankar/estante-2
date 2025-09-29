import { lazy } from 'react';
import { RouteObject, ScrollRestoration } from 'react-router-dom';

// Layout e Utilitários
import { Layout } from '../components/layout/Layout';
import { ContainedLayout } from '../components/layout/ContainedLayout'; 
import { ProtectedRoute } from './ProtectedRoute';
import { withSuspense } from './RouteSuspense';
import { NotFound } from '../pages/NotFound';

// Loaders
import { layoutLoader } from './loaders';

// # atualizado: Módulos de Rota (adminRoutes não é mais importado aqui)
import { 
  authRoutes, 
  profileRoutes, 
  protectedProfileRoutes, 
  friendsRoutes, 
  protectedChatRoutes, 
  notificationRoutes 
} from '../features/routes';

import { PATHS } from './paths';

const Home = lazy(() => import('../pages/Home').then(module => ({ default: module.Home })));

export const routes: RouteObject[] = [
  {
    element: (
      <>
        <Layout />
        <ScrollRestoration />
      </>
    ),
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
              
              // # atualizado: Rota de admin agora usa 'lazy' para carregar sob demanda
              {
                // O path base para o módulo que será carregado
                path: 'admin',
                // A função lazy importa o módulo SOMENTE quando /admin/* for acessado
                lazy: () => import('../features/admin/admin.routes'),
              },
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