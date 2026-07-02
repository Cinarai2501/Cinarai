import * as admin from 'firebase-admin';

// Initialize Admin SDK
// This should be used in server-side code (API routes, server components, etc.)
// Make sure to set FIREBASE_ADMIN_SDK_KEY environment variable

let adminApp: admin.app.App;
let adminAuth: admin.auth.Auth;
let adminFirestore: admin.firestore.Firestore;
let adminStorage: admin.storage.Storage;

const initializeAdmin = (): void => {
  if (adminApp) return;

  try {
    const serviceAccountKey = process.env.FIREBASE_ADMIN_SDK_KEY;
    
    if (!serviceAccountKey) {
      console.warn(
        'FIREBASE_ADMIN_SDK_KEY not found. Admin SDK not initialized.'
      );
      return;
    }

    const serviceAccount = JSON.parse(serviceAccountKey);

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });

    adminAuth = admin.auth(adminApp);
    adminFirestore = admin.firestore(adminApp);
    adminStorage = admin.storage(adminApp);
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
};

// Initialize on module load
initializeAdmin();

export {
  adminApp,
  adminAuth,
  adminFirestore,
  adminStorage,
};

/**
 * Verify ID token (server-side)
 */
export const verifyIdToken = async (token: string): Promise<admin.auth.DecodedIdToken | null> => {
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
