import { initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth, type DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import type { ServiceAccount } from 'firebase-admin';
import { validateEnv } from '@/lib/env.server';

validateEnv();

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

function getRequiredEnvVar(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}

function parsePrivateKey(raw: string | undefined): string | null {
  if (!raw) return null;
  const normalized = raw.replace(/\\n/g, '\n');
  return normalized.trim().length > 0 ? normalized : null;
}

function getInitializationErrorMessage(keys: Array<readonly [string, string | undefined]>): string | undefined {
  const missing = keys
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length === 0) {
    return undefined;
  }

  return `Firebase Admin initialization skipped. Missing required env vars: ${missing.join(', ')}`;
}

function initializeAdmin(): void {
  if (adminApp) {
    return;
  }

  const projectId = getRequiredEnvVar('FIREBASE_PROJECT_ID');
  const clientEmail = getRequiredEnvVar('FIREBASE_CLIENT_EMAIL');
  const privateKeyRaw = getRequiredEnvVar('FIREBASE_PRIVATE_KEY');

  const missingError = getInitializationErrorMessage([
    ['FIREBASE_PROJECT_ID', projectId],
    ['FIREBASE_CLIENT_EMAIL', clientEmail],
    ['FIREBASE_PRIVATE_KEY', privateKeyRaw],
  ]);

  if (missingError) {
    adminInitializationError = missingError;
    globalThisAny.__firebaseAdminInitializationError = adminInitializationError;
    return;
  }

  const privateKey = parsePrivateKey(privateKeyRaw);
  if (!privateKey) {
    adminInitializationError = 'Firebase Admin initialization skipped. FIREBASE_PRIVATE_KEY is invalid or empty after newline normalization.';
    globalThisAny.__firebaseAdminInitializationError = adminInitializationError;
    return;
  }

  try {
    const serviceAccount: ServiceAccount = {
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey,
    };

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId,
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
    adminInitializationError = error instanceof Error ? error.message : 'Firebase Admin initialization failed.';
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
