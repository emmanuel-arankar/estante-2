import { getPendingRequestCount } from '../services/firestore';
import { getCurrentUser } from '../services/auth';

export const layoutLoader = async () => {
  // # atualizado: Aguarda a resolução do estado de autenticação para evitar erros.
  const user = await getCurrentUser();
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