import { redirect } from 'react-router-dom';
import { toastErrorClickable } from '../../components/ui/toast';
import { queryClient } from '../../lib/queryClient';
import { getCurrentUser } from '../../services/auth';
import { userByNicknameQuery, userQuery } from '../users/user.queries';
import { PATHS } from '../../router/paths';

// # atualizado: Loader apenas para perfis públicos (/:nickname)
export const profileLoader = async ({ params }: any) => {
  const { nickname } = params;
  if (!nickname) return redirect(PATHS.HOME);

  try {
    return await queryClient.ensureQueryData(userByNicknameQuery(nickname));
  } catch (error) {
    toastErrorClickable('Usuário não encontrado.');
    // O ErrorElement da rota irá capturar a exceção e exibir a mensagem
    throw error;
  }
};

// # atualizado: Loader específico para o perfil do usuário logado (/profile/me)
export const meProfileLoader = async () => {
  const user = getCurrentUser(); // # atualizado: Chamada síncrona, sem 'await'
  if (!user) return redirect(PATHS.LOGIN);
  return await queryClient.ensureQueryData(userQuery(user.uid));
};

export const editProfileLoader = async () => {
  const user = getCurrentUser(); // # atualizado: Chamada síncrona, sem 'await'
  if (!user) return redirect(PATHS.LOGIN);
  return await queryClient.ensureQueryData(userQuery(user.uid));
};
