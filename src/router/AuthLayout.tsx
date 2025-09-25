import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

export const AuthLayout = () => {
  return (
    <>
      <Outlet />
      <Toaster position="top-right" />
    </>
  );
};