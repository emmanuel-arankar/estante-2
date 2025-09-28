import { getPendingRequestCount } from '../services/firestore';
import { awaitAuthReady, getCurrentUser } from '../services/auth';

export const layoutLoader = async () => {
  await awaitAuthReady(); // # atualizado: Aguarda a inicialização
  const user = getCurrentUser(); // # atualizado: Obtém o usuário após a inicialização

  if (!user) {
    return { initialFriendRequests: 0 };
  }
  try {
    const initialFriendRequests = await getPendingRequestCount(user.uid);
    return { initialFriendRequests };
  } catch (error) {
    console.error("Layout loader error:", error);
    return { initialFriendRequests: 0 };
  }
};