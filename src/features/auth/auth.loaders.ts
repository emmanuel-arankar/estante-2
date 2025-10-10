import { defer, redirect } from "react-router-dom";
import { PATHS } from "@/router/paths";
import { awaitAuthReady } from "@/services/auth";
import { authStore } from "@/stores/authStore";
import { queryClient } from "@/lib/queryClient"; // # atualizado: Importa queryClient
import { userQuery } from "@/features/users/user.queries"; // # atualizado: Importa userQuery
import { getPendingRequestCount } from "@/services/firestore"; // # atualizado: Importa a contagem

// # atualizado: Loader unificado para rotas públicas
export const publicOnlyLoader = async () => {
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