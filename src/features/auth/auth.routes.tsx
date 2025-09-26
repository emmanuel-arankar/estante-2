import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { loginAction, registerAction } from './auth.actions';
import { withSuspense } from '../../router/RouteSuspense';

// # atualizado: Lógica de suspense removida daqui
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
