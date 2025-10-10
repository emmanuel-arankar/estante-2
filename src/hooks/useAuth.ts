import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
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
    // Este hook só precisa rodar no cliente.
    if (import.meta.env.SSR) return;

    const unsubscribe = onAuthStateChanged(auth, (newFirebaseUser) => {
      // A principal tarefa deste hook agora é lidar com o estado inicial e deslogar.
      // O login/cadastro é tratado pelas actions para evitar loops.
      
      if (!newFirebaseUser && firebaseUser) {
        // O usuário foi deslogado (em outra aba, por exemplo).
        fetch('/api/sessionLogout', { method: 'POST' });
        clearAuth();
      }
      
      // Garante que o estado de carregamento inicial seja finalizado.
      if (loading) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
    // A lista de dependências é simplificada.
  }, [firebaseUser, loading, setLoading, clearAuth]);

  // Retorna o estado atual da store.
  return { user: profile, firebaseUser, loading, error };
};