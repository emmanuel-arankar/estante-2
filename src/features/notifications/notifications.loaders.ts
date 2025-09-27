import { redirect } from 'react-router-dom';
import { getUserNotifications } from '../../services/firestore';
import { queryClient } from '../../lib/queryClient';
import { getCurrentUser } from '../../services/auth';

const notificationsQuery = (userId: string) => ({
    queryKey: ['notifications', userId],
    queryFn: () => getUserNotifications(userId),
});

export const notificationsLoader = async () => {
  // # atualizado: Adicionado 'await' para esperar a Promise do usuário.
  const user = await getCurrentUser();
  if (!user) return redirect('/login');
  return await queryClient.ensureQueryData(notificationsQuery(user.uid));
};