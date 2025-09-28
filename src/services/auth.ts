import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import { useAuthStore } from '../stores/authStore';
import {
  toastSuccessClickable,
  toastErrorClickable,
} from '@/components/ui/toast';
import { queryClient } from '@/lib/queryClient';

export const logout = async() => {
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

// # atualizado: Esta promise é apenas para aguardar a verificação inicial do Firebase na inicialização do app.
const authReadyPromise = new Promise<FirebaseUser | null>(resolve => {
  const unsubscribe = onAuthStateChanged(auth, user => {
    unsubscribe();
    resolve(user);
  });
});

// # atualizado: Renomeado para maior clareza. Usado no loader principal do layout.
export const awaitAuthReady = () => authReadyPromise;

// # atualizado: Nova função síncrona. Retorna o usuário ATUAL do SDK do Firebase.
// É seguro usar isso em loaders após ações como login, pois o estado já foi atualizado.
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const isAuthenticated = (): boolean => {
  const user = getCurrentUser();
  return !!user;
};
