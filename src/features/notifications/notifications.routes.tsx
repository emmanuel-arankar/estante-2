import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { withSuspense } from '../../router/RouteSuspense';
import { notificationsLoader } from '../../router/loaders';

const Notifications = lazy(() => import('../../pages/Notifications').then(module => ({ default: module.Notifications })));

export const notificationRoutes: RouteObject[] = [
  {
    path: '/notifications',
    element: withSuspense(Notifications),
    loader: notificationsLoader,
  },
];