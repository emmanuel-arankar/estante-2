import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import { useAuthStore } from '../stores/authStore';
import { toastSuccessClickable, toastErrorClickable } from '@/components/ui/toast';
import { queryClient } from '@/lib/queryClient';

// Função para chamar a Cloud Function e definir o cookie
export const setSessionCookie = async (user: FirebaseUser) => {
  try {
    const idToken = await user.getIdToken(true);

    // Usa fetch para chamar a API através do proxy do Vite
    const response = await fetch('/api/sessionLogin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new Error('A resposta da rede não foi ok');
    }

    localStorage.setItem('session', 'true');
  } catch (error) {
    console.error("Falha ao definir o cookie de sessão:", error);
    localStorage.removeItem('session');
    // Re-lança o erro para que a ação de login saiba que falhou
    throw error;
  }
};

export const logout = async () => {
  try {
    console.log('🚪 Iniciando logout...');
    
    // Chama a função de logout do backend para limpar o cookie
    await fetch('/api/sessionLogout', { method: 'POST' });

    // Limpa o estado local
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