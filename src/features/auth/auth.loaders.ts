import { redirect } from "react-router-dom";
import { PATHS } from "@/router/paths";
// # atualizado: Importa a função correta do seu arquivo de autenticação
import { awaitAuthReady } from "@/services/auth"; 
import { authStore } from "@/stores/authStore";

export const rootLoader = async () => {
  // No servidor (SSR), a store já foi preenchida pela Cloud Function.
  // Usamos esses dados diretamente para uma resposta instantânea.
  if (import.meta.env.SSR) {
    const user = authStore.getState().user;
    return { user };
  }

  // No cliente, esperamos a verificação inicial do Firebase Auth terminar.
  // Isso garante que sabemos o status de login antes de continuar.
  const user = await awaitAuthReady();
  return { user };
};

// # atualizado: Os loaders de login/registro também devem usar awaitAuthReady
export const loginLoader = async () => {
  const user = await awaitAuthReady();
  if (user) {
    return redirect(PATHS.HOME);
  }
  return null;
};

export const registerLoader = async () => {
  const user = await awaitAuthReady();
  if (user) {
    return redirect(PATHS.HOME);
  }
  return null;
};