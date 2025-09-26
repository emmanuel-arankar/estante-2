import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useAuthStore } from '../stores/authStore';
import {
  toastSuccessClickable,
  toastErrorClickable,
} from '@/components/ui/toast';
import { queryClient } from '@/lib/queryClient';

export const logout = async () => {
  try {
    console.log('🚪 Iniciando logout...');
    // # atualizado: Limpa o estado e ativa o loading ANTES de deslogar.
    useAuthStore.getState().clearAuth();
    queryClient.clear();

    await signOut(auth);

    console.log('✅ Logout realizado com sucesso');
    toastSuccessClickable('Logout realizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error);
    toastErrorClickable('Erro ao fazer logout. Tente novamente.');
    // # atualizado: Garante que o loading seja desativado em caso de erro.
    useAuthStore.getState().setLoading(false);
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const isAuthenticated = () => {
  return !!auth.currentUser;
};