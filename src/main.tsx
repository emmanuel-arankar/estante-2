import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from './lib/queryClient';
import { router } from './router'; // atualizado
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* # atualizado: RouterProvider agora é a raiz e nunca será desmontado */}
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);