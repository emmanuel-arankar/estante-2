import { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { profileLoader, editProfileLoader } from '../../router/loaders';
import { editProfileAction } from '../../router/actions';
import { ProtectedRoute } from '../../router/ProtectedRoute';

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