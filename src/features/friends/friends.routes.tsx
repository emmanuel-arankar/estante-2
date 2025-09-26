import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { withSuspense } from '../../router/RouteSuspense';

const Friends = lazy(() => import('../../pages/Friends').then(module => ({ default: module.Friends })));

export const friendsRoutes: RouteObject[] = [
  {
    path: '/friends',
    element: withSuspense(Friends),
  },
];
