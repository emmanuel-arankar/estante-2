import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from './firebase';
import { useAuthStore } from '../stores/authStore';
import { toastSuccessClickable, toastErrorClickable } from '@/components/ui/toast';
import { queryClient } from '@/lib/queryClient';

// Função para chamar a Cloud Function e definir o cookie
export const setSessionCookie = async (user: FirebaseUser) => {
  try {
    const idToken = await user.getIdToken(true);
    const functions = getFunctions();
    const createSessionCookie = httpsCallable(functions, 'createSessionCookie');
    await createSessionCookie({ idToken });
    
    localStorage.setItem('session', 'true');
  } catch (error) {
    console.error("Falha ao definir o cookie de sessão:", error);
    localStorage.removeItem('session');
  }
};

export const logout = async () => {
  try {
    console.log('🚪 Iniciando logout...');
    await signOut(auth);
    localStorage.removeItem('session');
    useAuthStore.getState().clearAuth();
    queryClient.clear();
    console.log('✅ Logout realizado com sucesso');
    toastSuccessClickable('Logout realizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error);
    toastErrorClickable('Erro ao fazer logout. Tente novamente.');
    throw error;
  }
};

const authReadyPromise = new Promise<FirebaseUser | null>(resolve => {
  const unsubscribe = onAuthStateChanged(auth, user => {
    unsubscribe();
    resolve(user);
  });
});

export const awaitAuthReady = () => authReadyPromise;

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const isAuthenticated = (): boolean => {
  const user = getCurrentUser();
  return !!user;
};