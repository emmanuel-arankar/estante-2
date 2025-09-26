import { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { loginAction, registerAction } from '../../router/actions';

// Helper para suspense fallback
const RouteFallback = () => (
  <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

const withSuspense = (Component: React.ElementType) => (
  <Suspense fallback={<RouteFallback />}>
    <Component />
  </Suspense>
);

// Componentes lazy
const Login = lazy(() => import('../../pages/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('../../pages/Register').then(module => ({ default: module.Register })));
const ForgotPassword = lazy(() => import('../../pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })));

export const authRoutes: RouteObject[] = [
  {
    path: '/login',
    element: withSuspense(Login),
    action: loginAction,
  },
  {
    path: '/register',
    element: withSuspense(Register),
    action: registerAction,
  },
  {
    path: '/forgot-password',
    element: withSuspense(ForgotPassword),
  },
];