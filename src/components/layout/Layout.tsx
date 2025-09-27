import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from 'react-hot-toast';
import { Outlet, useLoaderData, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // # atualizado
import { LoadingSpinner } from '../ui/loading-spinner'; // # atualizado

interface LayoutData {
  initialFriendRequests: number;
}

export const Layout = () => {
  const { initialFriendRequests } = useLoaderData() as LayoutData;
  const location = useLocation();
  const { loading: authLoading } = useAuth(); // # atualizado

  const noFooterRoutes = ['/login', '/register', '/forgot-password'];
  const shouldShowFooter = !noFooterRoutes.includes(location.pathname);

  // # atualizado: O spinner de carregamento inicial da aplicação agora vive aqui.
  // Isso garante que o roteador não seja desmontado e que nenhuma rota renderize
  // antes da autenticação ser verificada.
  if (authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center justify-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-lg text-gray-600 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

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