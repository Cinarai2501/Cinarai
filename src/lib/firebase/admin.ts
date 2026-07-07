import { initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth, type DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { validateEnv } from '@/lib/env';

validateEnv();

let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminFirestore: Firestore | undefined;
let adminStorage: Storage | undefined;

const initializeAdmin = (): void => {
  if (adminApp) return;

  try {
    const serviceAccountKey = process.env.FIREBASE_ADMIN_SDK_KEY;

    if (!serviceAccountKey) {
      console.warn('[Firebase Admin] FIREBASE_ADMIN_SDK_KEY is not set — Admin SDK will not be initialized. Server-side auth and admin Firestore will be unavailable.');
      return;
    }

    const serviceAccount = JSON.parse(serviceAccountKey);

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || undefined;

    if (!projectId) console.warn('[Firebase Admin] NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set.');
    if (!storageBucket) console.warn('[Firebase Admin] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not set.');

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId,
      storageBucket,
      databaseURL,
    });

    adminAuth = getAuth(adminApp);
    adminFirestore = getFirestore(adminApp);
    adminStorage = getStorage(adminApp);
  } catch (error) {
    console.error('[Firebase Admin] Failed to initialize Admin SDK:', error);
  }
};

initializeAdmin();

export { adminApp, adminAuth, adminFirestore, adminStorage };

export const verifyIdToken = async (token: string): Promise<DecodedIdToken | null> => {
  try {
    if (!adminAuth) {
      console.warn('Admin Auth not initialized');
      return null;
    }
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
};
