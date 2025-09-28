import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../models';
import { PATHS } from './paths';

interface RoleProtectedRouteProps {
  allowedRoles: UserRole[];
}

export const RoleProtectedRoute = ({ allowedRoles }: RoleProtectedRouteProps) => {
  const { profile } = useAuth(); // Usamos o perfil que contém o papel

  // O componente ProtectedRoute geral já cuida do estado de loading e se não há usuário
  // Aqui, focamos apenas na autorização.
  if (!profile) {
    // Se por algum motivo não houver perfil, redireciona para a home como segurança
    return <Navigate to={PATHS.HOME} replace />;
  }

  const userRole = profile.role || 'user'; // Padrão para 'user' se não definido

  return allowedRoles.includes(userRole)
    ? <Outlet />
    : <Navigate to={PATHS.HOME} replace />; // Redireciona para a home se não tiver permissão
};
