import React from "react";
import ReactDOMServer from "react-dom/server";
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from "react-router-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routes } from "./router/routes";
import type { Request as ExpressRequest } from "express"; // # atualizado
import { authStore } from "./stores/authStore";
import { User } from "./models";

function createFetchRequest(req: ExpressRequest): Request {
  const origin = `${req.protocol}://${req.get("host")}`;
  const url = new URL(req.originalUrl || req.url, origin);

  const controller = new AbortController();
  req.on("close", () => controller.abort());

  const headers = new Headers();
  for (const [key, values] of Object.entries(req.headers)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values as string);
      }
    }
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    signal: controller.signal,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
  }

  return new Request(url.href, init);
}

// # atualizado: A função 'render' agora aceita o usuário e as opções
export async function render(
  req: ExpressRequest,
  profile: User | null,
  options: ReactDOMServer.RenderToPipeableStreamOptions
) {
  // # atualizado: Seta o usuário e para o loading. ESTA É A CHAVE!
  authStore.getState().setProfile(profile);
  authStore.getState().setLoading(false); 

  const queryClient = new QueryClient();
  const handler = createStaticHandler(routes);

  const fetchRequest = createFetchRequest(req);
  const context = await handler.query(fetchRequest);

  if (context instanceof Response) {
    throw context;
  }

  const router = createStaticRouter(handler.dataRoutes, context);

  const stream = ReactDOMServer.renderToPipeableStream(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <StaticRouterProvider
          router={router}
          context={context}
          nonce="nonce"
        />
      </QueryClientProvider>
    </React.StrictMode>,
    options
  );

  return { pipe: stream.pipe, abort: stream.abort };
}