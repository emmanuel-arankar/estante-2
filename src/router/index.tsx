import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { ForgotPassword } from '../pages/ForgotPassword';
import { Profile } from '../pages/Profile';
import { EditProfile } from '../pages/EditProfile';
import { Messages } from '../pages/Messages';
import { Chat } from '../pages/Chat';
import { Friends } from '../pages/Friends';
import { Notifications } from '../pages/Notifications';
import { NotFound } from '../pages/NotFound';

import { ProtectedRoute } from './ProtectedRoute';
import { AuthLayout } from './AuthLayout';

export const router = createBrowserRouter([
  // # atualizado: Rotas com o layout principal (Header e Footer)
  {
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/profile/:nickname',
        element: <Profile />,
      },
      {
        path: '/friends',
        element: <Friends />,
      },
      {
        path: '/notifications',
        element: <Notifications />,
      },
      // # atualizado: Agrupamento de rotas protegidas
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/profile/edit',
            element: <EditProfile />,
          },
          {
            path: '/messages',
            element: <Messages />,
          },
          {
            path: '/chat/:receiverId',
            element: <Chat />,
          },
        ],
      },
    ],
  },
  // # atualizado: Rotas com o layout de autenticação (tela cheia, sem Header/Footer)
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/register',
        element: <Register />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPassword />,
      },
    ],
  },
  // # atualizado: Rota "catch-all" para páginas não encontradas
  {
    path: '*',
    element: <NotFound />,
  },
]);