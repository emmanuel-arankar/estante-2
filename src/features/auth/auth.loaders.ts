import { defer, redirect } from "react-router-dom";
import { PATHS } from "@/router/paths";
import { awaitAuthReady } from "@/services/auth";
import { authStore } from "@/stores/authStore";
import { queryClient } from "@/lib/queryClient";
import { userQuery } from "@/features/users/user.queries";
import { getPendingRequestCount } from "@/services/firestore";
import { User } from "@/models";
import { User as FirebaseUser } from "firebase/auth";

export const publicOnlyLoader = async () => {
  // No servidor, a verificação é instantânea
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

// # ATUALIZADO: Este é o loader que substitui o layoutLoader
export const rootLoader = async () => {
  // LÓGICA DO SERVIDOR
  if (import.meta.env.SSR) {
    const profile = authStore.getState().profile;
    if (!profile) {
      return { profile: null, initialFriendRequests: 0 };
    }
    const friendRequestsPromise = getPendingRequestCount(profile.id);
    return defer({
      profile,
      initialFriendRequests: friendRequestsPromise,
    });
  }

  // LÓGICA DO CLIENTE
  const firebaseUser = await awaitAuthReady();
  if (!firebaseUser) {
    authStore.getState().clearAuth();
    return { profile: null, initialFriendRequests: 0 };
  }

  // Se o perfil já está na store, evita busca desnecessária
  const existingProfile = authStore.getState().profile;
  if (existingProfile && existingProfile.id === firebaseUser.uid) {
    const initialFriendRequests = await getPendingRequestCount(firebaseUser.uid);
    return { profile: existingProfile, initialFriendRequests };
  }

  // Se não, busca tudo
  try {
    const [profile, initialFriendRequests] = await Promise.all([
      queryClient.ensureQueryData(userQuery(firebaseUser.uid)),
      getPendingRequestCount(firebaseUser.uid),
    ]);

    authStore.getState().setUser(firebaseUser);
    authStore.getState().setProfile(profile as User);
    
    return { profile, initialFriendRequests };
  } catch (error) {
    console.error("Erro no rootLoader do cliente:", error);
    authStore.getState().clearAuth();
    await fetch('/api/sessionLogout', { method: 'POST' });
    return { profile: null, initialFriendRequests: 0 };
  }
};