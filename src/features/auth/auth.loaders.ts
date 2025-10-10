import { defer, redirect } from "react-router-dom";
import { PATHS } from "@/router/paths";
import { awaitAuthReady } from "@/services/auth";
import { authStore } from "@/stores/authStore";
import { queryClient } from "@/lib/queryClient"; // # atualizado: Importa queryClient
import { userQuery } from "@/features/users/user.queries"; // # atualizado: Importa userQuery
import { getPendingRequestCount } from "@/services/firestore"; // # atualizado: Importa a contagem

// # atualizado: Loader unificado para rotas públicas
export const publicOnlyLoader = async () => {
  // 1. Lógica para o Servidor (SSR)
  // No servidor, lemos diretamente da store que já foi preenchida
  if (import.meta.env.SSR) {
    const user = authStore.getState().user;
    if (user) {
      return redirect(PATHS.HOME);
    }
    return null;
  }

  // 2. Lógica para o Cliente (Navegação)
  // Para cliques após o app carregar, a store já está sincronizada.
  // Esta verificação síncrona é instantânea e resolve o "engasgo".
  const userInStore = authStore.getState().user;
  if (userInStore) {
    return redirect(PATHS.HOME);
  }

  // 3. Fallback para o carregamento inicial do cliente
  // Se a store ainda estiver vazia (caso raro), esperamos a verificação inicial.
  const user = await awaitAuthReady();
  if (user) {
    return redirect(PATHS.HOME);
  }

  return null;
};

export const rootLoader = async () => {
  // --- LÓGICA DO SERVIDOR (SSR) ---
  if (import.meta.env.SSR) {
    const user = authStore.getState().user;
    if (!user) {
      return { user: null, userProfile: null, initialFriendRequests: 0 };
    }
    // No servidor, ADIAMOS (defer) o carregamento do perfil e das solicitações
    // para não bloquear o streaming.
    const userProfilePromise = queryClient.ensureQueryData(userQuery(user.uid));
    const friendRequestsPromise = getPendingRequestCount(user.uid);
    
    return defer({
      user,
      userProfile: userProfilePromise,
      initialFriendRequests: friendRequestsPromise,
    });
  }

  // --- LÓGICA DO CLIENTE ---
  const user = await awaitAuthReady();
  if (!user) {
    return { user: null, userProfile: null, initialFriendRequests: 0 };
  }

  // No cliente, fazemos o mesmo que o layoutLoader fazia.
  const [userProfile, initialFriendRequests] = await Promise.all([
    queryClient.ensureQueryData(userQuery(user.uid)),
    getPendingRequestCount(user.uid)
  ]);
  
  return { user, userProfile, initialFriendRequests };
};