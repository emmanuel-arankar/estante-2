import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from 'react-hot-toast';
import { Outlet, useLoaderData, useLocation } from 'react-router-dom';

// # atualizado: Interface para garantir a tipagem dos dados do loader
interface LayoutData {
  initialFriendRequests: number;
}

export const Layout = () => {
  // # atualizado: Obtém os dados que o loader forneceu
  const { initialFriendRequests } = useLoaderData() as LayoutData;
  const location = useLocation();
  
  const noFooterRoutes = ['/login', '/register', '/forgot-password'];
  const shouldShowFooter = !noFooterRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* # atualizado: Passa os dados pré-carregados como props para o Header */}
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