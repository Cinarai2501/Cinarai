import type { User, UserCredential } from 'firebase/auth';
import type { UserDocument, UserRole } from '@/types/firestore';
import { normalizeEmail } from '@/lib/userAudit';
import { isAllowedUserRole } from './role';

export type AuthUser = User;

export interface AuthSignUpDependencies {
  getSignInMethods: (email: string) => Promise<string[]>;
  queryUserDocumentsByEmail: (email: string) => Promise<UserDocument[]>;
  firebaseSignUp: (email: string, password: string) => Promise<UserCredential>;
  updateUserProfile: (user: User, displayName: string) => Promise<void>;
  getFirestoreDocument: (collection: 'users', docId: string) => Promise<UserDocument | null>;
  upsertUser: (user: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export interface AuthSignInDependencies {
  firebaseSignIn: (email: string, password: string) => Promise<UserCredential>;
}

export async function signUpUser(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'student',
  deps: AuthSignUpDependencies
): Promise<User> {
  if (!isAllowedUserRole(role)) {
    throw new Error('Role tidak valid. Pilih student, teacher, atau admin.');
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('Email tidak valid.');
  }

  const existingMethods = await deps.getSignInMethods(normalizedEmail);
  if (existingMethods.length > 0) {
    throw new Error('Email ini sudah terdaftar. Silakan login atau gunakan fitur Lupa Password.');
  }

  const existingUserDocs = await deps.queryUserDocumentsByEmail(normalizedEmail);
  if (existingUserDocs.length > 0) {
    throw new Error('Email ini sudah terdaftar. Silakan login atau gunakan fitur Lupa Password.');
  }

  const userCredential = await deps.firebaseSignUp(normalizedEmail, password);
  const firebaseUser = userCredential.user;

  await deps.updateUserProfile(firebaseUser, displayName);

  const existingUserDocument = await deps.getFirestoreDocument('users', firebaseUser.uid);
  if (existingUserDocument) {
    // Existing user document will be merged by upsertUser.
  }

  const userData: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'> = {
    uid: firebaseUser.uid,
    email: normalizedEmail,
    displayName: firebaseUser.displayName ?? displayName,
    photoURL: firebaseUser.photoURL ?? undefined,
    role,
    isActive: true,
    duplicate: false,
    lastLoginAt: undefined,
  };

  await deps.upsertUser(userData);
  return firebaseUser;
}

export async function signInUser(
  email: string,
  password: string,
  deps: AuthSignInDependencies
): Promise<AuthUser> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('Email tidak valid.');
  }

  const userCredential = await deps.firebaseSignIn(normalizedEmail, password);
  return userCredential.user;
}
