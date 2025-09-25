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
import { ProtectedRoute } from './ProtectedRoute';
import { NotFound } from '../pages/NotFound';

export const router = createBrowserRouter([
  {
    // # atualizado: Apenas uma rota pai com o Layout principal
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      // # atualizado: Rotas de autenticação agora usam o Layout principal
      // (o footer será ocultado pelo próprio Layout)
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
      // # atualizado: Rotas protegidas continuam agrupadas
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
  {
    path: '*',
    element: <NotFound />,
  },
]);