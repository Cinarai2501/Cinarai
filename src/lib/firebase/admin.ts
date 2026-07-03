import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth, type DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

let adminApp: App;
let adminAuth: Auth;
let adminFirestore: Firestore;
let adminStorage: Storage;

const initializeAdmin = (): void => {
  if (getApps().length > 0) return;

  try {
    const serviceAccountKey = process.env.FIREBASE_ADMIN_SDK_KEY;

    if (!serviceAccountKey) {
      console.warn('FIREBASE_ADMIN_SDK_KEY not found. Admin SDK not initialized.');
      return;
    }

    const serviceAccount = JSON.parse(serviceAccountKey);

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });

    adminAuth = getAuth(adminApp);
    adminFirestore = getFirestore(adminApp);
    adminStorage = getStorage(adminApp);
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
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
