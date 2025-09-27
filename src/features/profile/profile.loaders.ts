import { redirect } from 'react-router-dom';
import { toastErrorClickable } from '../../components/ui/toast';
import { queryClient } from '../../lib/queryClient';
// # atualizado: Importa a função síncrona.
import { getCurrentUser } from '../../services/auth';
import { userByNicknameQuery, userQuery } from '../users/user.queries';

// # atualizado: Ambas as funções agora usam o getCurrentUser síncrono.
export const profileLoader = async ({ params }: any) => {
  const { nickname } = params;
  if (!nickname) return redirect('/');

  if (nickname === 'me') {
    const user = getCurrentUser();
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
  const user = getCurrentUser();
  if (!user) return redirect('/login');
  return await queryClient.ensureQueryData(userQuery(user.uid));
};