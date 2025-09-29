import { useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from 'react-hot-toast';
import { Outlet, useLoaderData, useLocation, useMatches, useNavigation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { mainPageFadeVariants, MAIN_PAGE_TRANSITION } from '../../lib/animations';
import { PATHS } from '@/router/paths';
import { FocusManager } from '@/router/FocusManager';
import { toastSuccessClickable } from '../ui/toast';
import { User } from '@/models';

interface LayoutData {
  userProfile: User | null;
  initialFriendRequests: number;
}

// Hook de título da página (sem alteração)
const usePageTitle = () => {
  const matches = useMatches();

  useEffect(() => {
    const lastMatchWithTitle = [...matches].reverse().find(
      (match) => match.handle && typeof (match.handle as any).title === 'function'
    );

    if (lastMatchWithTitle) {
      const handle = lastMatchWithTitle.handle as any;
      document.title = handle.title(lastMatchWithTitle.data);
    } else {
      document.title = 'Estante de Bolso - Sua rede social de leitura';
    }
  }, [matches]);
};

export const Layout = () => {
  const { userProfile, initialFriendRequests } = useLoaderData() as LayoutData;
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
  }, [location]);

  // Usar o pathname completo garante que a animação dispare em qualquer mudança de rota
  const pageKey = location.pathname + location.search;
  const noFooterPaths = [PATHS.LOGIN, PATHS.REGISTER, PATHS.FORGOT_PASSWORD];
  const shouldShowFooter = !noFooterPaths.includes(location.pathname);

  // O spinner de tela cheia foi movido para o ProtectedRoute
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <FocusManager />
      <div
        className={`fixed top-0 left-0 right-0 h-1 bg-emerald-500 z-[99] transition-transform duration-300 ${
          isLoading ? 'scale-x-100' : 'scale-x-0'
        }`}
        style={{ transformOrigin: 'left' }}
      />
      
      {/* O Header é estático, sempre presente e estável */}
      <Header userProfile={userProfile} initialFriendRequests={initialFriendRequests} />

      {/* A animação agora acontece somente no container do conteúdo principal */}
      <main className="flex-1 w-full pt-20 grid">
        <AnimatePresence mode="wait">
          <motion.div
            key={pageKey}
            variants={mainPageFadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={MAIN_PAGE_TRANSITION}
            className="grid" // Garante que o filho preencha o espaço
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