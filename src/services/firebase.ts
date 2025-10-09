import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

export const app = initializeApp(firebaseConfig);

if (import.meta.env.DEV) {
  try {
    console.log("Conectando aos emuladores locais do Firebase...");

    const auth = getAuth();
    connectAuthEmulator(auth, "http://127.0.0.1:9099");

    const firestore = getFirestore();
    connectFirestoreEmulator(firestore, "127.0.0.1", 8080);

    const storage = getStorage();
    connectStorageEmulator(storage, "127.0.0.1", 9199);

    const functions = getFunctions();
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);

    console.log("✅ Conectado aos emuladores.");
  } catch (error) {
    console.error("Falha ao conectar aos emuladores:", error);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const database = getDatabase(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;