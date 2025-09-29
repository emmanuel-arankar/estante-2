import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const {
    user,
    loading,
    error,
    setUser,
    setLoading,
    setError,
  } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // A lógica de buscar o perfil foi removida daqui
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]); // Dependências simplificadas

  // Retorna apenas o usuário do Firebase e o estado de carregamento do auth
  return { user, loading, error };
};
