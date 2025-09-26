import { lazy } from 'react'; // # atualizado
import { RouteObject } from 'react-router-dom';
import { profileLoader, editProfileLoader } from '../../router/loaders';
import { editProfileAction } from '../../router/actions';
import { ProtectedRoute } from '../../router/ProtectedRoute';
import { withSuspense } from '../../router/RouteSuspense'; // # atualizado

// # atualizado: Lógica de suspense removida daqui
const Profile = lazy(() => import('../../pages/Profile').then(module => ({ default: module.Profile })));
const EditProfile = lazy(() => import('../../pages/EditProfile').then(module => ({ default: module.EditProfile })));

// Rotas públicas de perfil
export const profileRoutes: RouteObject[] = [
  {
    path: '/profile/:nickname',
    element: withSuspense(Profile),
    loader: profileLoader,
  },
];

// Rotas protegidas de perfil
export const protectedProfileRoutes: RouteObject = {
  element: <ProtectedRoute />,
  children: [
    {
      path: '/profile/edit',
      element: withSuspense(EditProfile),
      loader: editProfileLoader,
      action: editProfileAction,
    },
  ],
};