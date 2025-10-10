import { defer, redirect } from "react-router-dom";
import { PATHS } from "@/router/paths";
import { awaitAuthReady } from "@/services/auth";
import { authStore } from "@/stores/authStore";
import { queryClient } from "@/lib/queryClient";
import { userQuery } from "@/features/users/user.queries";
import { getPendingRequestCount } from "@/services/firestore";
import { User } from "@/models";

// Loader para rotas que só podem ser acessadas por usuários deslogados
export const publicOnlyLoader = async () => {
  // No servidor, a verificação é instantânea a partir da store
  if (import.meta.env.SSR) {
    if (authStore.getState().profile) {
      return redirect(PATHS.HOME);
    }
    return null;
  }
  
  // No cliente, esperamos a confirmação do Firebase
  const user = await awaitAuthReady();
  if (user) {
    return redirect(PATHS.HOME);
  }
  return null;
};

// Loader principal da aplicação, executado em todas as rotas
export const rootLoader = async () => {
  // --- LÓGICA DO SERVIDOR (PARA SSR RÁPIDO) ---
  if (import.meta.env.SSR) {
    const profile = authStore.getState().profile;

    // Se não há perfil na store do servidor, não há usuário logado.
    if (!profile) {
      return { user: null, profile: null, initialFriendRequests: 0 };
    }
    
    // Se há perfil, ADIAMOS (defer) o carregamento dos dados secundários
    // para não bloquear o streaming. Isso é a chave para o TTFB baixo.
    const friendRequestsPromise = getPendingRequestCount(profile.id);
    
    return defer({
      user: null, // O user (firebase) não é serializável, usamos o profile
      profile,
      initialFriendRequests: friendRequestsPromise,
    });
  }

  // --- LÓGICA DO CLIENTE (PARA NAVEGAÇÃO E HIDRATAÇÃO) ---
  const firebaseUser = await awaitAuthReady();
  
  // Se não há usuário do firebase, limpa a store e retorna nulo
  if (!firebaseUser) {
    authStore.getState().clearAuth();
    return { user: null, profile: null, initialFriendRequests: 0 };
  }

  // Se há usuário, busca o perfil e os dados do layout
  try {
    const [profile, initialFriendRequests] = await Promise.all([
      queryClient.ensureQueryData(userQuery(firebaseUser.uid)),
      getPendingRequestCount(firebaseUser.uid)
    ]);

    // Sincroniza a store com os dados frescos
    authStore.getState().setUser(firebaseUser);
    authStore.getState().setProfile(profile as User);
    
    return { user: firebaseUser, profile, initialFriendRequests };

  } catch (error) {
    console.error("Erro no rootLoader do cliente:", error);
    authStore.getState().clearAuth();
    return { user: null, profile: null, initialFriendRequests: 0 };
  }
};