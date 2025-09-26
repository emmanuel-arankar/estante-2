import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { withSuspense } from '../../router/RouteSuspense';

const Messages = lazy(() => import('../../pages/Messages').then(module => ({ default: module.Messages })));
const Chat = lazy(() => import('../../pages/Chat').then(module => ({ default: module.Chat })));

export const protectedChatRoutes: RouteObject[] = [
  {
    path: '/messages',
    element: withSuspense(Messages),
  },
  {
    path: '/chat/:receiverId',
    element: withSuspense(Chat),
  },
];
