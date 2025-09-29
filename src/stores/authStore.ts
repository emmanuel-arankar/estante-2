import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthState {
  user: FirebaseUser | null;
  // profile: User | null; // Removido
  loading: boolean;
  error: string | null;
  setUser: (user: FirebaseUser | null) => void;
  // setProfile: (profile: User | null) => void; // Removido
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  // profile: null, // Removido
  loading: true,
  error: null,
  setUser: (user) => set({ user }),
  // setProfile: (profile) => set({ profile }), // Removido
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearAuth: () => set({ 
    user: null, 
    // profile: null, // Removido
    loading: false, 
    error: null 
  }),
}));
