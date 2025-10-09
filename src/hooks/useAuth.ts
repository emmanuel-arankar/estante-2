import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthStore } from '../stores/authStore';
import { setSessionCookie } from '@/services/auth';

export const useAuth = () => {
  const {
    user,
    loading,
    error,
    setUser,
    setLoading,
  } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      if (firebaseUser) {
        await setSessionCookie(firebaseUser);
      } else {
        // Se deslogou, chama nossa API para limpar o cookie
        await fetch('/api/sessionLogout', { method: 'POST' });
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  // Retorna apenas o usuário do Firebase e o estado de carregamento do auth
  return { user, loading, error };
};