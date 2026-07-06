'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? '',
};

// Validate required environment variables
const validateConfig = (): boolean => {
  const requiredKeys = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  const missingKeys = requiredKeys.filter(
    (key) => !process.env[key as keyof typeof process.env]
  );

  if (missingKeys.length > 0) {
    console.warn(
      `Missing Firebase environment variables: ${missingKeys.join(', ')}`
    );
    return false;
  }

  return true;
};

// Initialize Firebase
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;
let storage: FirebaseStorage | undefined;

export const initializeFirebase = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!validateConfig()) {
    console.warn('Firebase config is incomplete; initializing with the provided values anyway.');
  }

  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  firestore = getFirestore(app);
  storage = getStorage(app);
};

// Initialize on module load
initializeFirebase();

export const getFirebaseAuth = (): Auth => {
  initializeFirebase();

  if (!auth) {
    throw new Error('Firebase Auth is not available');
  }

  return auth;
};

export const getFirebaseFirestore = (): Firestore => {
  initializeFirebase();

  if (!firestore) {
    throw new Error('Firebase Firestore is not available');
  }

  return firestore;
};

export const getFirebaseStorage = (): FirebaseStorage => {
  initializeFirebase();

  if (!storage) {
    throw new Error('Firebase Storage is not available');
  }

  return storage;
};

export { app };
export default firebaseConfig;
