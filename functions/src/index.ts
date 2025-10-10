import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import cookieParser from "cookie-parser";

// @ts-ignore - Permite importar o arquivo JS gerado pelo build do Vite
import { render } from "../dist/server/entry-server.js";
import { User } from "@/models";

// Conecta o Admin SDK aos emuladores se estiver em ambiente local
if (process.env.FUNCTIONS_EMULATOR) {
  console.log("Conectando o Cloud Functions aos emuladores locais do Firebase...");

  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = "127.0.0.1:9199";

  console.log("✅ Conectado o Cloud Functions aos emuladores.");
}

// Inicializa o Firebase Admin SDK
admin.initializeApp();

// --- Funções de Autenticação ---

const corsHandler = cors({ origin: true });

/**
 * Cria um cookie de sessão a partir de um ID token do Firebase.
 */
export const sessionLogin = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }
    const { idToken } = request.body;
    if (!idToken) {
      response.status(400).send("ID token não fornecido.");
      return;
    }
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 dias
    try {
      const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
      const options = { maxAge: expiresIn, httpOnly: true, secure: true };
      response.cookie("__session", sessionCookie, options);
      response.status(200).send({ status: "success" });
    } catch (error) {
      console.error("Erro ao criar cookie de sessão:", error);
      response.status(401).send("Falha na autenticação.");
    }
  });
});

/**
 * Desconecta o usuário limpando o cookie de sessão.
 */
export const sessionLogout = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    response.clearCookie("__session");
    response.status(200).send({ status: "success" });
  });
});


// --- Função Principal de Server-Side Rendering (SSR) ---

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use(cookieParser());

app.get("*", async (req, res) => {
  try {
    const sessionCookie = req.cookies.__session || "";
    let profile = null;

    try {
      const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
      const userDoc = await admin.firestore().collection("users").doc(decodedClaims.uid).get();

      if (userDoc.exists) {
        const userData = userDoc.data()!;
        // # atualizado: Monta o objeto 'profile' com o tipo 'User' correto.
        // Não tentamos mais simular um FirebaseUser.
        profile = {
          id: userDoc.id,
          ...userData,
          createdAt: userData.createdAt.toDate(),
          updatedAt: userData.updatedAt.toDate(),
          // Garanta que todos os campos de data sejam convertidos com .toDate()
        } as User;
      }
    } catch (error) {
      profile = null;
    }


    const template = fs.readFileSync(
      path.resolve(__dirname, "../dist/client/index.html"),
      "utf-8"
    );

    // # atualizado: Passa o objeto 'user' para a função render
    const { pipe, abort } = await render(req, profile, {
      onShellReady() {
        res.statusCode = 200;
        res.setHeader("Content-type", "text/html");
        const [htmlStart] = template.split(``);
        res.write(htmlStart);
        pipe(res);
      },
      onAllReady() {
        const [_, htmlEnd] = template.split(``);
        res.write(htmlEnd);
        res.end();
      },
      onError(err: any) {
        abort();
        console.error("SSR Stream Error:", err);
        if (!res.headersSent) {
          res.status(500).send("<h1>Algo deu errado durante a renderização.</h1>");
        }
      },
    });
  } catch (error) {
    // Trata erros, incluindo os de redirecionamento vindos do entry-server
    if (error instanceof Response && error.status >= 300 && error.status <= 399) {
      const location = error.headers.get("Location");
      if (location) {
        return res.redirect(error.status, location);
      }
    }
    console.error("SSR Handler Error:", error);
    if (!res.headersSent) {
      res.status(500).send("<h1>Erro interno no servidor.</h1>");
    }
  }
});

export const ssr = functions.https.onRequest(app);