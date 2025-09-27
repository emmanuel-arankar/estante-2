import { getPendingRequestCount } from '../services/firestore';
import { getCurrentUser } from '../services/auth';

// # atualizado: A função volta a ser síncrona para compatibilidade.
export { getCurrentUser };

export const layoutLoader = async () => {
  // # atualizado: A chamada volta a ser síncrona, pois o Layout garante que o auth já foi resolvido.
  const user = getCurrentUser();
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