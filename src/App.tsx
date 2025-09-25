import { RouterProvider } from 'react-router-dom';
import { router } from './router';

// Este componente agora tem a única responsabilidade de renderizar
// o RouterProvider, garantindo que ele nunca seja desmontado.
// Isso corrige o bug de redirecionamento após o login.
function App() {
  return <RouterProvider router={router} />;
}

export default App;