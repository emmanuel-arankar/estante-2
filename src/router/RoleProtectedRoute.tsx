import * as React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../models';
import { PATHS } from './paths';

// # atualizado: Adicionando a propriedade 'children' à interface
interface RoleProtectedRouteProps {
  allowedRoles: UserRole[];
  children?: React.ReactNode;
}

// # atualizado: Recebendo 'children' como prop
export const RoleProtectedRoute = ({ allowedRoles, children }: RoleProtectedRouteProps) => {
  const { profile } = useAuth(); // Usamos o perfil que contém o papel

  // O componente ProtectedRoute geral já cuida do estado de loading e se não há usuário
  // Aqui, focamos apenas na autorização.
  if (!profile) {
    // Se por algum motivo não houver perfil, redireciona para a home como segurança
    return <Navigate to={PATHS.HOME} replace />;
  }

  const userRole = profile.role || 'user'; // Padrão para 'user' se não definido

  // # atualizado: Renderiza os 'children' se eles forem passados, senão, renderiza o <Outlet />.
  // Isso torna o componente versátil para ambos os usos.
  return allowedRoles.includes(userRole)
    ? <>{children || <Outlet />}</>
    : <Navigate to={PATHS.HOME} replace />; // Redireciona para a home se não tiver permissão
};
