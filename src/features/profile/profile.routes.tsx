// src/features/profile/profile.routes.tsx

// # atualizado
import React, { lazy } from 'react';
import { RouteObject, Outlet } from 'react-router-dom';
import {
  profileLoader,
  editProfileLoader,
  meProfileLoader,
} from './profile.loaders';
import { editProfileAction } from './profile.actions';
import { withSuspense } from '../../router/RouteSuspense';
import { ROUTE_PATTERNS, PATHS } from '../../router/paths';
import { ErrorElement } from '../../router/ErrorElement';
import { User, Edit3 } from 'lucide-react';

const Profile = lazy(() => import('../../pages/Profile').then(module => ({ default: module.Profile })));
const EditProfile = lazy(() => import('../../pages/EditProfile').then(module => ({ default: module.EditProfile })));

// Componentes placeholder (sem alteração)
const ProfilePosts = () => <div className="text-center py-8 text-gray-500"><p>Nenhum post ainda.</p></div>;
const ProfileBooks = () => <div className="text-center py-8 text-gray-500"><p>Nenhum livro na estante ainda.</p></div>;
const ProfileReviews = () => <div className="text-center py-8 text-gray-500"><p>Nenhuma resenha ainda.</p></div>;
const ProfileFriends = () => <div className="text-center py-8 text-gray-500"><p>A lista de amigos aparecerá aqui.</p></div>;
const ProfileActivity = () => <div className="text-center py-8 text-gray-500"><p>A atividade recente aparecerá aqui.</p></div>;

// Rotas de abas (sem alteração)
const profileTabRoutes: RouteObject[] = [
  { index: true,      element: <ProfilePosts /> },
  { path: 'posts',    element: <ProfilePosts /> },
  { path: 'books',    element: <ProfileBooks /> },
  { path: 'reviews',  element: <ProfileReviews /> },
  { path: 'friends',  element: <ProfileFriends /> },
  { path: 'activity', element: <ProfileActivity /> },
];

// Rota de perfis públicos (sem alteração)
export const profileRoutes: RouteObject[] = [
  {
    path: ROUTE_PATTERNS.PROFILE,
    element: withSuspense(Profile),
    loader: profileLoader,
    errorElement: <ErrorElement />,
    handle: {
      breadcrumb: (data: any) => ({
        label: data?.displayName || 'Perfil',
        icon: <User className="h-4 w-4" />,
      }),
      title: (data: any) => `${data?.displayName || 'Perfil'} | Estante de Bolso`,
    },
    children: profileTabRoutes,
  },
];

// # atualizado: Nova estrutura para as rotas protegidas que corrige o breadcrumb e a renderização.
export const protectedProfileRoutes: RouteObject[] = [
  {
    path: PATHS.PROFILE_ME, // Rota pai: /profile/me
    element: <Outlet />,    // Este elemento pai apenas renderiza seus filhos
    handle: {
      // O breadcrumb "Meu Perfil" fica nesta rota pai
      breadcrumb: () => ({
        label: 'Meu Perfil',
        icon: <User className="h-4 w-4" />,
      }),
    },
    children: [
      {
        // Esta é uma rota "sem caminho" (pathless) que agrupa a página de perfil e suas abas.
        // Ela renderiza o componente Profile, que por sua vez tem um <Outlet /> para as abas.
        element: withSuspense(Profile),
        loader: meProfileLoader,
        errorElement: <ErrorElement />,
        handle: {
          title: () => 'Meu Perfil | Estante de Bolso',
        },
        children: profileTabRoutes, // As abas são filhas da página de perfil
      },
      {
        path: 'edit', // Rota filha para edição: /profile/me/edit
        element: withSuspense(EditProfile),
        loader: editProfileLoader,
        action: editProfileAction,
        handle: {
          // O breadcrumb "Editar" agora é corretamente aninhado
          breadcrumb: () => ({
            label: 'Editar',
            icon: <Edit3 className="h-4 w-4" />,
          }),
          title: () => 'Editar Perfil | Estante de Bolso',
        },
      },
    ],
  },
];