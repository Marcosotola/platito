import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Sin variables de entorno la carta funciona en modo demostración. */
export const firebaseConfigurado = Boolean(config.apiKey && config.projectId);

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
