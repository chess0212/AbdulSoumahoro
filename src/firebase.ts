import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import defaultFirebaseConfig from "../firebase-applet-config.json";

// Utilise les variables d'environnement VITE_ si elles sont définies pour vous permettre
// d'utiliser votre propre projet Firebase (pour contrôler pleinement les domaines autorisés, les méthodes
// d'authentification et votre base de données). Sinon, utilise les configurations par défaut.
const metaEnv = (import.meta as any).env || {};

// Permet de vérifier s'il s'agit d'un placeholder ou d'une valeur vide
const getFirebaseVal = (envVal: string | undefined, defaultVal: string): string => {
  if (
    envVal &&
    envVal.trim() !== "" &&
    envVal !== "VOTRE_API_KEY" &&
    envVal !== "VOTRE_SENDER_ID" &&
    envVal !== "VOTRE_APP_ID" &&
    !envVal.startsWith("VOTRE_")
  ) {
    return envVal;
  }
  return defaultVal;
};

const firebaseConfig = {
  apiKey: getFirebaseVal(metaEnv.VITE_FIREBASE_API_KEY, defaultFirebaseConfig.apiKey),
  authDomain: getFirebaseVal(metaEnv.VITE_FIREBASE_AUTH_DOMAIN, defaultFirebaseConfig.authDomain),
  projectId: getFirebaseVal(metaEnv.VITE_FIREBASE_PROJECT_ID, defaultFirebaseConfig.projectId),
  storageBucket: getFirebaseVal(metaEnv.VITE_FIREBASE_STORAGE_BUCKET, defaultFirebaseConfig.storageBucket),
  messagingSenderId: getFirebaseVal(metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID, defaultFirebaseConfig.messagingSenderId),
  appId: getFirebaseVal(metaEnv.VITE_FIREBASE_APP_ID, defaultFirebaseConfig.appId),
  measurementId: getFirebaseVal(metaEnv.VITE_FIREBASE_MEASUREMENT_ID, defaultFirebaseConfig.measurementId),
  firestoreDatabaseId: getFirebaseVal(metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID, defaultFirebaseConfig.firestoreDatabaseId),
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
