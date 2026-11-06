import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

// Estos datos no son secretos (viajan igual al navegador): la seguridad la
// dan las reglas de Firestore. Las variables de entorno, si existen, mandan.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC5zaiUkC_IDcvWQvqzjyKXhO5H4updtLo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "platito-70e55.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "platito-70e55",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "platito-70e55.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "828322590358",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:828322590358:web:a4edd2aed8a14638869cb7",
};

/**
 * UIDs de Firebase Auth con permiso de administrador (deben coincidir con
 * firestore.rules). También se pueden sumar admins creando un documento
 * `admins/{uid}` desde la consola, sin tocar el código.
 */
export const ADMINS = ["Or5332NE1WQEa3WDRLipBX2qolk1"];

/** Con NEXT_PUBLIC_MODO_DEMO=1 la carta funciona sin Firebase (para probar). */
export const firebaseConfigurado =
  process.env.NEXT_PUBLIC_MODO_DEMO !== "1" && Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

function obtenerApp(): FirebaseApp {
  if (!firebaseConfigurado) throw new Error("Firebase no está configurado");
  if (!app) app = getApps()[0] ?? initializeApp(config);
  return app;
}

/** Firestore con caché local: la carta abre al instante y funciona sin señal. */
export function obtenerDb(): Firestore {
  if (db) return db;
  const a = obtenerApp();
  try {
    db = initializeFirestore(a, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    db = getFirestore(a);
  }
  return db;
}

export function obtenerAuth(): Auth {
  if (!auth) auth = getAuth(obtenerApp());
  return auth;
}
