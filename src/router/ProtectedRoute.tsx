import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { PATHS } from './paths';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation(); // # atualizado

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // # atualizado: Passamos a localização original no `state` do redirecionamento
  return user ? <Outlet /> : <Navigate to={PATHS.LOGIN} state={{ from: location }} replace />;
};