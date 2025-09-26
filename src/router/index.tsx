// src/router/index.tsx

import { lazy, Suspense } from 'react';
// # atualizado: importações dos novos módulos de rota
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from './ProtectedRoute';
import { NotFound } from '../pages/NotFound';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { layoutLoader, notificationsLoader } from './loaders';
import { authRoutes } from '../features/auth/auth.routes';
import { profileRoutes, protectedProfileRoutes } from '../features/profile/profile.routes';

// Componente de fallback para usar enquanto as páginas carregam
const RouteFallback = () => (
  <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

// Todas as páginas agora são importadas dinamicamente (Lazy Loading)
const Home = lazy(() => import('../pages/Home').then(module => ({ default: module.Home })));
const Messages = lazy(() => import('../pages/Messages').then(module => ({ default: module.Messages })));
const Chat = lazy(() => import('../pages/Chat').then(module => ({ default: module.Chat })));
const Friends = lazy(() => import('../pages/Friends').then(module => ({ default: module.Friends })));
const Notifications = lazy(() => import('../pages/Notifications').then(module => ({ default: module.Notifications })));

// Função helper para envolver rotas em Suspense e evitar repetição
const withSuspense = (Component: React.ElementType) => (
  <Suspense fallback={<RouteFallback />}>
    <Component />
  </Suspense>
);

// # atualizado: Estrutura de rotas simplificada
const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: withSuspense(Home),
  },
  ...authRoutes,
  ...profileRoutes,
  {
    path: '/friends',
    element: withSuspense(Friends),
  },
  {
    path: '/notifications',
    element: withSuspense(Notifications),
    loader: notificationsLoader,
  },
  {
    element: <ProtectedRoute />,
    children: [
      protectedProfileRoutes, // Rotas de perfil protegidas
      {
        path: '/messages',
        element: withSuspense(Messages),
      },
      {
        path: '/chat/:receiverId',
        element: withSuspense(Chat),
      },
    ],
  },
];

export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <NotFound />,
    loader: layoutLoader,
    children: appRoutes, // # atualizado
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);