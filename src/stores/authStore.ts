import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '@/models';

interface AuthState {
  user: FirebaseUser | null; // Objeto de autenticação do Firebase
  profile: User | null;      // Perfil completo do seu Firestore
  loading: boolean;
  error: string | null;
  isLoadingProfile: boolean;
  loadingMessage: string | null; // # atualizado
  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: User | null) => void; // # atualizado: Nova ação
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsLoadingProfile: (isLoadingProfile: boolean, message?: string | null) => void;
  initializeUser: (user: any) => void;
  clearAuth: () => void;
}

export const authStore = create<AuthState>((set) => ({
  user: null,
  profile: null, // # atualizado: Adiciona o perfil ao estado inicial
  loading: true,
  error: null,
  isLoadingProfile: false,
  loadingMessage: null, // # atualizado
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }), // # atualizado: Implementa a nova ação
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setIsLoadingProfile: (isLoadingProfile, message = null) => set({ isLoadingProfile, loadingMessage: message }), // # atualizado
  initializeUser: (user) => set({ user, loading: false }),
  clearAuth: () => set({
    user: null,
    profile: null, // # atualizado: Limpa o perfil também
    loading: false,
    error: null,
    isLoadingProfile: false,
    loadingMessage: null
  }),
}));

export const useAuthStore = authStore;