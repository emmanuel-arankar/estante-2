import { getPendingRequestCount } from '../services/firestore';
import { awaitAuthReady, getCurrentUser } from '../services/auth';
import { queryClient } from '../lib/queryClient';
import { userQuery } from '../features/users/user.queries';

export const layoutLoader = async () => {
  await awaitAuthReady();
  const user = getCurrentUser();

  if (!user) {
    // Se não há usuário, retorna os dados vazios
    return { userProfile: null, initialFriendRequests: 0 };
  }

  try {
    // Busca o perfil do usuário e as solicitações de amizade em paralelo
    const [userProfile, initialFriendRequests] = await Promise.all([
      queryClient.ensureQueryData(userQuery(user.uid)),
      getPendingRequestCount(user.uid)
    ]);
    
    return { userProfile, initialFriendRequests };
  } catch (error) {
    console.error("Layout loader error:", error);
    // Em caso de erro, retorna dados vazios para não quebrar a aplicação
    return { userProfile: null, initialFriendRequests: 0 };
  }
};
