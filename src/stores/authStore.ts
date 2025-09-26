import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../models';

interface AuthState {
  user: FirebaseUser | null;
  profile: User | null; // atualizado
  loading: boolean;
  error: string | null;
  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: User | null) => void; // atualizado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
}

// # atualizado
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true, // Inicia como true na primeira carga
  error: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearAuth: () => set({ 
    user: null, 
    profile: null, 
    loading: true, // # atualizado: Essencial para reativar o loading no logout
    error: null 
  }),
}));