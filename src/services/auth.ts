import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'; // atualizado
import { auth } from './firebase';
import { useAuthStore } from '../stores/authStore';
import {
  toastSuccessClickable,
  toastErrorClickable,
} from '@/components/ui/toast';
import { queryClient } from '@/lib/queryClient';

// # atualizado: Criamos uma Promise que resolve com o usuário (ou null)
let authInitialized = false;
const authPromise = new Promise<{ user: FirebaseUser | null }>((resolve) => {
  if (authInitialized) {
    resolve({ user: auth.currentUser });
    return;
  }
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    authInitialized = true;
    resolve({ user });
    unsubscribe();
  });
});

// # atualizado: Esta função agora é assíncrona e aguarda a inicialização
export const getCurrentUser = async (): Promise<FirebaseUser | null> => {
  const { user } = await authPromise;
  return user;
};

export const logout = async () => {
  try {
    console.log('🚪 Iniciando logout...');
    useAuthStore.getState().clearAuth();
    queryClient.clear();

    await signOut(auth);
    // # atualizado: Resetamos a "sentinela" para o próximo login
    authInitialized = false;

    console.log('✅ Logout realizado com sucesso');
    toastSuccessClickable('Logout realizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error);
    toastErrorClickable('Erro ao fazer logout. Tente novamente.');
    useAuthStore.getState().setLoading(false);
    throw error;
  }
};

export const isAuthenticated = async (): Promise<boolean> => { // atualizado
  const user = await getCurrentUser();
  return !!user;
};