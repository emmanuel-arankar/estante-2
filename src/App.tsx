import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuth } from './hooks/useAuth';
import { LoadingSpinner } from './components/ui/loading-spinner';

function App() {
  const { loading } = useAuth();

  console.log('🚀 App renderizando, authLoading:', loading);

  // ⏳ Mostrar loading até autenticação + perfil estarem completos
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center justify-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-lg text-gray-600 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  console.log('✅ Autenticação completa, renderizando app');
  return <RouterProvider router={router} />;
}

export default App;