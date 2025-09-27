import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../models';

interface AuthState {
  user: FirebaseUser | null;
  profile: User | null;
  loading: boolean;
  error: string | null;
  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true, // # atualizado: Sempre inicia como true para a verificação inicial.
  error: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearAuth: () => set({ 
    user: null, 
    profile: null, 
    // # atualizado: Resetar para 'false' no logout, pois a app já está carregada.
    // O estado 'true' inicial só é necessário na primeira carga da página.
    loading: false, 
    error: null 
  }),
}));