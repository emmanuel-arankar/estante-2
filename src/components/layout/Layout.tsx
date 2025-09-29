import { useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from 'react-hot-toast';
import { Outlet, useLoaderData, useLocation, useMatches, useNavigation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/loading-spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { mainPageFadeVariants, MAIN_PAGE_TRANSITION } from '../../lib/animations';
import { PATHS } from '@/router/paths';
import { FocusManager } from '@/router/FocusManager';
import { User } from '@/models';
import { toastSuccessClickable } from '../ui/toast';

// Hook customizado para gerenciar o título da página
const usePageTitle = () => {
  const matches = useMatches();

  useEffect(() => {
    // Encontra a rota mais específica (a última na hierarquia) que tenha um 'handle' com a propriedade 'title'
    const lastMatchWithTitle = [...matches].reverse().find(
      (match) => match.handle && typeof (match.handle as any).title === 'function'
    );

    if (lastMatchWithTitle) {
      const handle = lastMatchWithTitle.handle as any;
      // Executa a função 'title', passando os dados do loader daquela rota
      document.title = handle.title(lastMatchWithTitle.data);
    } else {
      // Título padrão se nenhuma rota definir um
      document.title = 'Estante de Bolso - Sua rede social de leitura';
    }
  }, [matches]); // Re-executa sempre que as rotas ativas mudarem
};

// Definir a interface para os dados do loader
interface LayoutData {
  userProfile: User | null;
  initialFriendRequests: number;
}

export const Layout = () => {
  const { userProfile, initialFriendRequests } = useLoaderData() as LayoutData;
  const { loading: authLoading } = useAuth();
  const location = useLocation();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  usePageTitle();

  useEffect(() => {
    const toastMessage = sessionStorage.getItem('showLoginSuccessToast');
    if (toastMessage) {
      toastSuccessClickable(toastMessage);
      sessionStorage.removeItem('showLoginSuccessToast');
    }
    // Dispara a verificação a cada mudança de página
  }, [location]);

  const pageKey = location.pathname.split('/')[1] || 'home';
  const noFooterPaths = [PATHS.LOGIN, PATHS.REGISTER, PATHS.FORGOT_PASSWORD];
  const shouldShowFooter = !noFooterPaths.includes(location.pathname);

  // O spinner de tela cheia agora só aparece durante a verificação inicial
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner className="h-12 w-12 text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <FocusManager />
      <div
        className={`fixed top-0 left-0 right-0 h-1 bg-emerald-500 z-[99] transition-transform duration-300 ${
          isLoading ? 'scale-x-100' : 'scale-x-0'
        }`}
        style={{ transformOrigin: 'left' }}
      />
      {/* Passar o perfil do usuário para o Header */}
      <Header userProfile={userProfile} initialFriendRequests={initialFriendRequests} />
      <main className="flex-1 w-full pt-20 grid">
        <AnimatePresence initial={false}>
          <motion.div
            key={pageKey} // # atualizado
            className="[grid-area:1/1]"
            variants={mainPageFadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={MAIN_PAGE_TRANSITION}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
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
