import { Request as ExpressRequest } from "express";

/**
 * Converte uma requisição do Express.js para um objeto Request padrão
 * que o React Router pode utilizar para renderização no lado do servidor.
 * @param req A requisição de entrada do Express.
 * @returns Um objeto Request compatível com a Fetch API.
 */
export function createFetchRequest(req: ExpressRequest): Request {
  const origin = `${req.protocol}://${req.get("host")}`;
  // Garante que a URL comece com '/'
  const urlPath = req.originalUrl.startsWith('/') ? req.originalUrl : `/${req.originalUrl}`;
  const url = new URL(urlPath, origin);

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
    // Para POST, PUT, etc., anexa o corpo da requisição
    init.body = req.body;
  }

  return new Request(url.href, init);
}