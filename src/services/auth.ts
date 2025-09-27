// # atualizado
import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import { useAuthStore } from '../stores/authStore';
import {
  toastSuccessClickable,
  toastErrorClickable,
} from '@/components/ui/toast';
import { queryClient } from '@/lib/queryClient';

/**
 * # atualizado: Obtém o usuário atual de forma assíncrona e confiável.
 * Esta função anexa um listener temporário para obter o estado de
 * autenticação mais recente, garantindo que os loaders e actions
 * não trabalhem com dados de usuário obsoletos, especialmente após login/logout.
 */
export const getCurrentUser = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      // # atualizado: Adicionado tratamento de erro na verificação de auth
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
};

export const logout = async () => {
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

// # atualizado: Esta função agora usa a nova e mais confiável getCurrentUser
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return !!user;
};