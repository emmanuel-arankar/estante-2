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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><Home /></Layout>,
  },
  {
    path: '/login',
    element: <Layout showFooter={false}><Login /></Layout>,
  },
  {
    path: '/register',
    element: <Layout showFooter={false}><Register /></Layout>,
  },
  {
    path: '/forgot-password',
    element: <Layout showFooter={false}><ForgotPassword /></Layout>,
  },
  {
    path: '/profile/:nickname',
    element: <Layout><Profile /></Layout>,
  },
  {
    path: '/profile/edit',
    element: <Layout><EditProfile /></Layout>,
  },
  {
    path: '/messages',
    element: <Layout><Messages /></Layout>,
  },
  {
    path: '/chat/:receiverId',
    element: <Layout><Chat /></Layout>,
  },
  {
    path: '/friends',
    element: <Layout><Friends /></Layout>,
  },
  {
    path: '/notifications',
    element: <Layout><Notifications /></Layout>,
  },
]);