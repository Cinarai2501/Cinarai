import 'server-only';
import { initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth, type DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import type { ServiceAccount } from 'firebase-admin';
import { getFirebaseAdminConfig } from './adminConfig';

declare global {
  // eslint-disable-next-line no-var
  var __firebaseAdminApp: App | undefined;
  // eslint-disable-next-line no-var
  var __firebaseAdminAuth: Auth | undefined;
  // eslint-disable-next-line no-var
  var __firebaseAdminFirestore: Firestore | undefined;
  // eslint-disable-next-line no-var
  var __firebaseAdminStorage: Storage | undefined;
  // eslint-disable-next-line no-var
  var __firebaseAdminInitializationError: string | undefined;
}

const globalThisAny = globalThis as typeof globalThis & {
  __firebaseAdminApp?: App;
  __firebaseAdminAuth?: Auth;
  __firebaseAdminFirestore?: Firestore;
  __firebaseAdminStorage?: Storage;
  __firebaseAdminInitializationError?: string;
};

let adminApp: App | undefined = globalThisAny.__firebaseAdminApp;
let adminAuth: Auth | undefined = globalThisAny.__firebaseAdminAuth;
let adminFirestore: Firestore | undefined = globalThisAny.__firebaseAdminFirestore;
let adminStorage: Storage | undefined = globalThisAny.__firebaseAdminStorage;
let adminInitializationError: string | undefined = globalThisAny.__firebaseAdminInitializationError;

function initializeAdmin(): void {
  if (adminApp) {
    return;
  }

  const result = getFirebaseAdminConfig(process.env);
  if (!result.ok) {
    adminInitializationError = result.error;
    globalThisAny.__firebaseAdminInitializationError = adminInitializationError;
    console.error('[firebase-admin] initialization skipped:', adminInitializationError);
    return;
  }

  try {
    const serviceAccount: ServiceAccount = result.credentials;

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: result.credentials.projectId,
    });

    adminAuth = getAuth(adminApp);
    adminFirestore = getFirestore(adminApp);
    adminStorage = getStorage(adminApp);

    globalThisAny.__firebaseAdminApp = adminApp;
    globalThisAny.__firebaseAdminAuth = adminAuth;
    globalThisAny.__firebaseAdminFirestore = adminFirestore;
    globalThisAny.__firebaseAdminStorage = adminStorage;
    globalThisAny.__firebaseAdminInitializationError = undefined;
  } catch (error) {
    console.error('[firebase-admin] initialization failed:', error);
    adminInitializationError = 'Firebase Admin initialization failed. Check server logs for details.';
    globalThisAny.__firebaseAdminInitializationError = adminInitializationError;
  }
}

initializeAdmin();

export { adminApp, adminAuth, adminFirestore, adminStorage, adminInitializationError };

export const verifyIdToken = async (token: string): Promise<DecodedIdToken | null> => {
  if (!adminAuth) {
    return null;
  }

  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    return null;
  }
};
