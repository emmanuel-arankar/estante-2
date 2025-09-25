import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useAuthStore } from '../stores/authStore';
import { toastSuccessClickable, toastErrorClickable } from '@/components/ui/toast';

export const logout = async () => {
  try {
    console.log('🚪 Iniciando logout...');
    await signOut(auth);
    
    // Limpar estado global
    useAuthStore.getState().clearAuth();
    
    console.log('✅ Logout realizado com sucesso');
    toastSuccessClickable('Logout realizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error);
    toastErrorClickable('Erro ao fazer logout. Tente novamente.');
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const isAuthenticated = () => {
  return !!auth.currentUser;
};