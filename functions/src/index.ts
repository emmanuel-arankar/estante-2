import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import express from "express";
import { readFileSync } from "fs";
import { resolve } from "path";
import { dehydrate } from "@tanstack/react-query";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import cookieParser from "cookie-parser";

// @ts-ignore: Importa a função de renderização e o queryClient do build do servidor.
const { render, queryClient } = require("../dist/server/entry-server.js");

// Inicializa o Firebase Admin SDK.
admin.initializeApp();

// --- FUNÇÃO CHAMÁVEL PARA CRIAR COOKIE DE SESSÃO ---
export const createSessionCookie = onCall(async (request) => {
  const idToken = request.data.idToken;
  if (typeof idToken !== 'string') {
    throw new HttpsError('unauthenticated', 'Nenhum ID token fornecido.');
  }
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 dias
  try {
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    return { sessionCookie };
  } catch (error) {
    logger.error('Erro ao criar o cookie de sessão:', error);
    throw new HttpsError('internal', 'Não foi possível criar o cookie de sessão.');
  }
});

// --- CONFIGURAÇÃO DO SERVIDOR EXPRESS ---
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.static(resolve(__dirname, "../dist/client"), { index: false }));

// --- ROTAS DE API PARA GERENCIAR A SESSÃO ---
app.post("/api/sessionLogin", (req, res) => {
  try {
    const { sessionCookie } = req.body;
    const options = { maxAge: 60 * 60 * 24 * 5 * 1000, httpOnly: true, secure: true, sameSite: 'strict' as const };
    res.cookie("session", sessionCookie, options);
    res.status(200).send({ status: "success" });
  } catch (error) {
    res.status(500).send({ status: 'error' });
  }
});

app.post("/api/sessionLogout", (req, res) => {
  res.clearCookie("session");
  res.status(200).send({ status: "success" });
});

// --- ROTA PRINCIPAL DE RENDERIZAÇÃO (SSR) ---
app.get("*", async (req, res) => {
  try {
    const sessionCookie = req.cookies.session || "";
    let decodedIdToken: admin.auth.DecodedIdToken | null = null;
    if (sessionCookie) {
      try {
        decodedIdToken = await admin.auth().verifySessionCookie(sessionCookie, true);
      } catch (e) {
        decodedIdToken = null;
      }
    }

    const url = req.protocol + "://" + req.get("host") + req.originalUrl;
    const template = readFileSync(resolve(__dirname, "../dist/client/index.html"), "utf-8");
    
    // # atualizado: Corrigido o ponto de divisão do template.
    const [templateStart, templateEnd] = template.split("");

    res.statusCode = 200;
    res.setHeader("Content-type", "text/html");
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.write(templateStart);

    const helmetContext = {};

    const initialUser = decodedIdToken ? {
      uid: decodedIdToken.uid,
      email: decodedIdToken.email,
      picture: decodedIdToken.picture,
    } : null;

    await render(new Request(url), {
      onShellReady(stream: any) {
        stream.pipe(res, { end: false });
      },
      onAllReady() {
        const { helmet } = helmetContext as { helmet: any };
        const dehydratedState = dehydrate(queryClient);
        const headTags = `${helmet.title.toString()}${helmet.meta.toString()}${helmet.link.toString()}`;
        const bodyEndTags = `<script>window.__DEHYDRATED_STATE__ = ${JSON.stringify(dehydratedState)};</script>`;
        const finalHtml = templateEnd
          .replace("</head>", `${headTags}</head>`)
          .replace("</body>", `${bodyEndTags}</body>`);
        res.write(finalHtml);
        res.end();
      },
      onError(error: any) {
        logger.error("Render Error:", error);
        res.statusCode = 500;
        res.end("Erro interno do servidor durante a renderização.");
      },
    },
    initialUser
    );
  } catch (error) {
    if (error instanceof Response && error.status >= 300 && error.status <= 399) {
      return res.redirect(error.status, error.headers.get("Location") || "/");
    }
    logger.error("Handler Error:", error);
    if (!res.headersSent) {
      res.status(500).send("Erro interno do servidor.");
    }
  }
});

// --- EXPORTAÇÃO DA CLOUD FUNCTION ---
export const ssrApp = onRequest(
  {
    region: "southamerica-east1",
    memory: "1GiB",
    minInstances: 1,
  },
  // # atualizado: Envelopa o 'app' em uma função para resolver o erro de tipo.
  (req, res) => app(req, res)
);