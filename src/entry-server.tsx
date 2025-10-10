import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router-dom/server';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner'; // # atualizado: Importa o Toaster
import { queryClient } from './lib/queryClient';
import { routes } from './router/routes';
import { createFetchRequest } from './utils/createFetchRequest';
import { authStore } from './stores/authStore';
import { User } from './models';
import type { Request as ExpressRequest } from 'express';

export async function render(
  req: ExpressRequest,
  profile: User | null,
  options: ReactDOMServer.RenderToPipeableStreamOptions
) {
  authStore.getState().setProfile(profile);
  authStore.getState().setLoading(false);

  const handler = createStaticHandler(routes);
  const fetchRequest = createFetchRequest(req);
  const context = await handler.query(fetchRequest);

  if (context instanceof Response) {
    throw context;
  }

  const router = createStaticRouter(handler.dataRoutes, context);

  const stream = ReactDOMServer.renderToPipeableStream(
    <React.StrictMode>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <StaticRouterProvider router={router} context={context} />
          <Toaster richColors position="top-right" /> {/* # ATUALIZADO: Incluído no servidor */}
        </QueryClientProvider>
      </HelmetProvider>
    </React.StrictMode>,
    options
  );

  return { pipe: stream.pipe, abort: stream.abort };
}