import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthStore } from '../stores/authStore';
import { setSessionCookie } from '@/services/auth';
import { queryClient } from '@/lib/queryClient';
import { userQuery } from '@/features/users/user.queries';
import { User } from '@/models';

export const useAuth = () => {
  // # atualizado: Pega os novos estados e ações da store
  const {
    user: firebaseUser,
    profile,
    loading,
    error,
    setUser,
    setProfile,
    setLoading,
    clearAuth,
  } = useAuthStore();

  useEffect(() => {
    // # atualizado: Apenas executa no lado do cliente
    if (import.meta.env.SSR) return;

    const unsubscribe = onAuthStateChanged(auth, async (newFirebaseUser) => {
      setUser(newFirebaseUser);

      if (newFirebaseUser) {
        // Se o usuário logou...
        try {
          // 1. Cria o cookie de sessão para o SSR funcionar
          await setSessionCookie(newFirebaseUser);

          // 2. Busca o perfil completo do Firestore
          const userProfile = await queryClient.fetchQuery(userQuery(newFirebaseUser.uid));
          setProfile(userProfile as User);

        } catch (e) {
          console.error("Falha ao buscar perfil ou criar sessão:", e);
          // Se algo der errado (ex: perfil não encontrado), desloga para evitar estado quebrado
          clearAuth();
          await fetch('/api/sessionLogout', { method: 'POST' });
        }
      } else {
        // Se o usuário deslogou, limpa tudo
        await fetch('/api/sessionLogout', { method: 'POST' });
        clearAuth();
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setProfile, setLoading, clearAuth]);

  // # atualizado: O 'usuário' da aplicação agora é o 'profile'.
  // Retornamos ambos para flexibilidade.
  return { user: profile, firebaseUser, loading, error };
};