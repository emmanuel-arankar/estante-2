import { redirect } from 'react-router-dom';
import { getCurrentUser } from '../../services/auth';
import { PATHS } from '../../router/paths';

export const publicOnlyLoader = async () => {
  const user = getCurrentUser();
  if (user) {
    // Se o usuário já está logado, redireciona para a página de perfil
    return redirect(PATHS.PROFILE_ME);
  }
  return null; // Permite o acesso se não houver usuário
};