import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";

// Inicializa o Firebase Admin SDK
admin.initializeApp();

const corsHandler = cors({ origin: true });

/**
 * Cria um cookie de sessão a partir de um ID token do Firebase.
 * O frontend envia o ID token, e esta função retorna um cookie HTTP Only.
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

    // O cookie de sessão expira em 14 dias.
    const expiresIn = 60 * 60 * 24 * 14 * 1000;

    try {
      // Cria o cookie de sessão.
      const sessionCookie = await admin
        .auth()
        .createSessionCookie(idToken, { expiresIn });

      // Configura o cookie no navegador do cliente.
      const options = { maxAge: expiresIn, httpOnly: true, secure: false };
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