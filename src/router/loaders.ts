import { getPendingRequestCount } from '../services/firestore';
import { getCurrentUser } from '../services/auth'; // atualizado

export { getCurrentUser }; // Re-exportar para outros loaders

// # atualizado: O loader principal agora é assíncrono
export const layoutLoader = async () => {
  const user = await getCurrentUser(); // Espera a autenticação
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