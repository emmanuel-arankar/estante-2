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

const authReadyPromise = new Promise<FirebaseUser | null>(resolve => {
  const unsubscribe = onAuthStateChanged(auth, user => {
    unsubscribe();
    resolve(user);
  });
});

// # atualizado: Função agora é assíncrona para aguardar a verificação inicial do Firebase.
// Isso evita a "condição de corrida" nos loaders.
export const getCurrentUser = async (): Promise<FirebaseUser | null> => {
  return authReadyPromise;
};

export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return !!user;
};
