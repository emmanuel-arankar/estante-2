import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useAuthStore } from '../stores/authStore';
import {
  toastSuccessClickable,
  toastErrorClickable,
} from '@/components/ui/toast';
import { queryClient } from '@/lib/queryClient';

export const logout = async( ) => {
  try {
    console.log('🚪 Iniciando logout...');
    useAuthStore.getState().clearAuth();
    queryClient.clear();

    await signOut(auth);

    console.log('✅ Logout realizado com sucesso');
    toastSuccessClickable('Logout realizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error);
    toastErrorClickable('Erro ao fazer logout. Tente novamente.');
    useAuthStore.getState().setLoading(false);
    throw error;
  }
};

// # atualizado: A função volta a ser síncrona.
// Ela é chamada pelos loaders APÓS o carregamento inicial da autenticação.
export const getCurrentUser = () => {
  return auth.currentUser;
};

// # atualizado: Função também se torna síncrona.
export const isAuthenticated = () => {
  return !!auth.currentUser;
};