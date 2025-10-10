import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router-dom/server';
import { routes } from './router/routes';
import { QueryClient, QueryClientProvider, dehydrate } from '@tanstack/react-query';
import type { Response } from 'express';
import { HelmetProvider } from 'react-helmet-async';

interface RenderProps {
  url: string;
  res: Response;
  template: string;
}

export async function render({ url, res, template }: RenderProps) {
  const handler = createStaticHandler(routes);
  const queryClient = new QueryClient();

  const fetchRequest = new Request(new URL(url, 'http://localhost'), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const context = await handler.query(fetchRequest);

  if (context instanceof Response) {
    res.redirect(context.status, context.headers.get('Location') || '/');
    return;
  }

  const router = createStaticRouter(handler.dataRoutes, context);
  const helmetContext: { helmet?: any } = {};

  const App = (
    <React.StrictMode>
      <HelmetProvider context={helmetContext}>
        <QueryClientProvider client={queryClient}>
          <StaticRouterProvider router={router} context={context} />
        </QueryClientProvider>
      </HelmetProvider>
    </React.StrictMode>
  );

  const stream = ReactDOMServer.renderToPipeableStream(App, {
    bootstrapScripts: ['/entry-client.js'],
    onShellReady() {
      // Pega o HTML renderizado e o estado do React Query
      const dehydratedState = dehydrate(queryClient);
      const { helmet } = helmetContext;

      // Monta as tags do head
      const head = `
        ${helmet.title.toString()}
        ${helmet.meta.toString()}
        ${helmet.link.toString()}
      `;

      // Injeta tudo no template HTML
      let html = template
        .replace(``, head)
        .replace(
          ``,
          `<div id="root">` // O div root é inserido aqui
        )
        .replace(
          '</body>',
          `<script>window.__DEHYDRATED_STATE__ = ${JSON.stringify(dehydratedState)};</script></body>`
        );
      
      res.statusCode = 200;
      res.setHeader('Content-type', 'text/html');
      
      // Envia o início do HTML
      res.write(html.split('</div>')[0] + '</div>');
      
      // Envia o resto do HTML em streaming
      stream.pipe(res);
    },
    onError(error) {
      console.error('Erro de Stream:', error);
      res.statusCode = 500;
      res.setHeader('Content-type', 'text/html');
      res.send('<h1>Algo deu errado no servidor.</h1>');
    },
  });
}