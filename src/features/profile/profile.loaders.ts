import { redirect } from 'react-router-dom';
import { toastErrorClickable } from '../../components/ui/toast';
import { queryClient } from '../../lib/queryClient';
import { getCurrentUser } from '../../services/auth';
import { userByNicknameQuery, userQuery } from '../users/user.queries';

export const profileLoader = async ({ params }: any) => {
  const { nickname } = params;
  if (!nickname) return redirect('/');

  if (nickname === 'me') {
    const user = await getCurrentUser();
    if (!user) return redirect('/login');
    return await queryClient.ensureQueryData(userQuery(user.uid));
  }

  try {
    return await queryClient.ensureQueryData(userByNicknameQuery(nickname));
  } catch (error) {
    toastErrorClickable('Usuário não encontrado.');
    return redirect('/');
  }
};

export const editProfileLoader = async () => {
  const user = await getCurrentUser();
  if (!user) return redirect('/login');
  return await queryClient.ensureQueryData(userQuery(user.uid));
};