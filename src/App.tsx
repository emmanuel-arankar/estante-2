import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuth } from './hooks/useAuth';
import { LoadingSpinner } from './components/ui/loading-spinner';

function App() {
  // # atualizado: O hook useAuth é chamado aqui para iniciar a verificação de auth.
  // A lógica de carregamento será movida para o Layout.
  useAuth();

  // # atualizado: O RouterProvider foi movido para main.tsx.
  // O componente App agora pode ser simplificado ou removido,
  // mas por enquanto vamos mantê-lo para conter a lógica do useAuth.
  // A renderização real acontecerá através da configuração do router.
  return <RouterProvider router={router} />;
}

export default App;