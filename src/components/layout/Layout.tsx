import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from 'react-hot-toast';
import { Outlet, useLoaderData, useLocation } from 'react-router-dom';

interface LayoutData {
  initialFriendRequests: number;
}

export const Layout = () => {
  const { initialFriendRequests } = useLoaderData() as LayoutData;
  const location = useLocation();

  const noFooterRoutes = ['/login', '/register', '/forgot-password'];
  const shouldShowFooter = !noFooterRoutes.includes(location.pathname);

  // # atualizado: O spinner de carregamento global foi removido.
  // A verificação de auth agora acontece nos loaders, antes do Layout renderizar.
  // Isso simplifica o componente e centraliza a lógica no roteador.

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <Header initialFriendRequests={initialFriendRequests} />
      <main className="flex-1 w-full pt-20">
        <Outlet />
      </main>
      {shouldShowFooter && <Footer />}
      <Toaster
        position="top-right"
        containerStyle={{ top: '88px' }}
        gutter={8}
      />
    </div>
  );
};