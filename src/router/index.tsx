import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from './ProtectedRoute';
import { NotFound } from '../pages/NotFound';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { profileLoader, editProfileLoader, notificationsLoader } from './loaders';
import { loginAction, registerAction, editProfileAction } from './actions'; 

// Componente de fallback para usar enquanto as páginas carregam
const RouteFallback = () => (
  <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

// Todas as páginas agora são importadas dinamicamente (Lazy Loading)
const Home = lazy(() => import('../pages/Home').then(module => ({ default: module.Home })));
const Login = lazy(() => import('../pages/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('../pages/Register').then(module => ({ default: module.Register })));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const Profile = lazy(() => import('../pages/Profile').then(module => ({ default: module.Profile })));
const EditProfile = lazy(() => import('../pages/EditProfile').then(module => ({ default: module.EditProfile })));
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

export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        path: '/',
        element: withSuspense(Home),
      },
      {
        path: '/login',
        element: withSuspense(Login),
        action: loginAction, // # atualizado
      },
      {
        path: '/register',
        element: withSuspense(Register),
        action: registerAction, // # atualizado
      },
      {
        path: '/forgot-password',
        element: withSuspense(ForgotPassword),
      },
      {
        path: '/profile/:nickname',
        element: withSuspense(Profile),
        loader: profileLoader,
      },
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
          {
            path: '/profile/edit',
            element: withSuspense(EditProfile),
            loader: editProfileLoader,
            action: editProfileAction, // # atualizado
          },
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
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);